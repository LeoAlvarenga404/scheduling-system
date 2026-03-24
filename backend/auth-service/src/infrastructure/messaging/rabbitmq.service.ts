import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: any = null;
  private channel: any = null;

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const exchange = process.env.RABBITMQ_EXCHANGE || 'auth';

    try {
      this.connection = await connect(url);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
    } catch (error) {
      console.error('Failed to connect to RabbitMQ for Auth Service:', error);
      // We don't throw here to allow app to start without RMQ in some envs, 
      // but in production it's critical.
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch (error) {
      console.error('Failed to close RabbitMQ connection:', error);
    }
  }

  async publish(routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
       console.warn('RabbitMQ channel is not open. Event will be lost (Outbox not yet implemented).');
       return false;
    }

    const exchange = process.env.RABBITMQ_EXCHANGE || 'auth';
    const payload = Buffer.from(JSON.stringify(message));

    return this.channel.publish(exchange, routingKey, payload, { persistent: true });
  }
}
