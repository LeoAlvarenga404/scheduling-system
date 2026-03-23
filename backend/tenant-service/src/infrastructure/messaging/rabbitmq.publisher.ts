import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqplib from 'amqplib';

@Injectable()
export class RabbitMQPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQPublisher.name);
  private connection: any;
  private channel: any;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
  }

  private async connect() {
    const rmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    this.connection = await amqplib.connect(rmqUrl);
    this.channel = await this.connection.createChannel();
    
    // Configured by user request: clinica.topic
    const exchange = process.env.RABBITMQ_EXCHANGE || 'clinica.topic';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    
    this.logger.log(`Connected to RabbitMQ at ${rmqUrl}`);
  }

  async publish(routingKey: string, payload: any): Promise<boolean> {
    const exchange = process.env.RABBITMQ_EXCHANGE || 'clinica.topic';
    try {
      const message = Buffer.from(JSON.stringify(payload));
      const success = this.channel.publish(exchange, routingKey, message, {
        persistent: true,
        messageId: payload.metadata?.eventId,
        timestamp: Date.now(),
        contentType: 'application/json',
      });
      return success;
    } catch (error) {
      this.logger.error(`Failed to publish message to ${routingKey}`, error);
      return false;
    }
  }
}
