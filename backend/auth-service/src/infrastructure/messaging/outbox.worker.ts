import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma/prisma.service';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: RabbitMQService,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const events = await this.prisma.outboxEvent.findMany({
        where: { processed: false },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      if (events.length === 0) return;

      this.logger.debug(`Found ${events.length} pending outbox events.`);

      for (const event of events) {
        const payloadObj = JSON.parse(event.payload);
        
        const routingKey = event.type
          .replace(/Event$/, '')
          .replace(/([a-z])([A-Z])/g, '$1.$2')
          .toLowerCase();
          
        const prdRoutingKey = `auth.${routingKey}`;

        // Standardize event envelope
        const payload = {
          metadata: {
            eventId: event.id,
            eventType: event.type,
            aggregateType: 'User',
            aggregateId: payloadObj.userId || 'system',
            occurredAt: payloadObj.occurredAt || event.createdAt.toISOString(),
            correlationId: payloadObj.correlationId,
            version: payloadObj.version || "1.0",
          },
          data: payloadObj,
        };

        const success = await this.publisher.publish(prdRoutingKey, payload);

        if (success !== false) {
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: { processed: true },
          });
        } else {
          this.logger.warn(`Failed to publish event ${event.id} to RabbitMQ.`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing outbox events', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
