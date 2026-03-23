import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqplib from 'amqplib';
import { PrismaService } from '../database/prisma/prisma.service';
import { ActivateTenantUseCase } from '../../application/use-cases/activate-tenant.usecase';

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  private connection: any;
  private channel: any;

  constructor(
    private readonly prisma: PrismaService,
    private readonly activateTenantUseCase: ActivateTenantUseCase,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.startConsuming();
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }

  private async connect() {
    const rmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    this.connection = await amqplib.connect(rmqUrl);
    this.channel = await this.connection.createChannel();
    
    const exchange = process.env.RABBITMQ_EXCHANGE || 'clinica.topic';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    
    // In PRD: consumidos from auth.user.registered
    const queueName = 'tenant.auth.events';
    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, exchange, 'auth.user.registered');
    
    this.logger.log(`Consumer connected to RabbitMQ at ${rmqUrl}, bound to auth.user.registered`);
  }

  private async startConsuming() {
    const queueName = 'tenant.auth.events';
    
    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      const eventId = msg.properties.messageId;
      if (!eventId) {
        this.logger.warn('Received message without messageId. Discarding.');
        this.channel.ack(msg);
        return;
      }

      try {
        const payloadStr = msg.content.toString();
        const payload = JSON.parse(payloadStr);
        
        // Inbox Pattern (Idempotency)
        const isProcessed = await this.isEventProcessed(eventId);
        if (isProcessed) {
          this.logger.log(`Event ${eventId} already processed (Inbox). Ignoring.`);
          this.channel.ack(msg);
          return;
        }

        const routingKey = msg.fields.routingKey;
        if (routingKey === 'auth.user.registered') {
          // payload.data contains tenantId
          const tenantId = payload.data?.tenantId;
          if (tenantId) {
            this.logger.log(`Activating tenant ${tenantId} due to auth.user.registered event`);
            const result = await this.activateTenantUseCase.execute({ tenantId });
            if (result.isLeft()) {
              this.logger.warn(`Failed to activate tenant ${tenantId}: ${result.value.message}`);
              // In production, we might want to DLQ this or just ack if it's an unrecoverable business error
            }
          }
        }

        // Mark as processed in Inbox
        await this.markEventProcessed(eventId, payload.data?.tenantId || 'unknown', 'auth.user.registered');
        this.channel.ack(msg);
      } catch (error) {
        this.logger.error(`Error processing message ${eventId}`, error);
        // Nack to requeue or send to DLQ based on policy
        this.channel.nack(msg, false, false); 
      }
    });
  }

  private async isEventProcessed(eventId: string): Promise<boolean> {
    const processedEvent = await this.prisma.processedEvent.findUnique({
      where: { eventId },
    });
    return !!processedEvent;
  }

  private async markEventProcessed(eventId: string, tenantId: string, eventType: string) {
    await this.prisma.processedEvent.create({
      data: {
        eventId,
        tenantId,
        eventType,
      },
    });
  }
}
