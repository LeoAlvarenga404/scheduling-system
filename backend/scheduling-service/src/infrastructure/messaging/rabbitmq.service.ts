import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { connect, Connection, Channel } from 'amqplib';

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
    const exchange = process.env.RABBITMQ_EXCHANGE || 'scheduling';

    try {
      this.connection = await connect(url);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange(exchange, 'topic', { durable: true });
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      // Depending on rules, maybe we shouldn't throw error if we want the app to start without RMQ attached immediately, but usually we throw.
      throw error;
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
      throw new Error('RabbitMQ channel is not open');
    }

    const exchange = process.env.RABBITMQ_EXCHANGE || 'scheduling';
    const payload = Buffer.from(JSON.stringify(message));

    return this.channel.publish(exchange, routingKey, payload, { persistent: true });
  }

  async startConsumer(queue: string, routingKey: string, handler: (msg: any) => Promise<void>) {
    if (!this.channel) {
      await this.connect();
    }

    const exchange = process.env.RABBITMQ_EXCHANGE || 'scheduling';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, exchange, routingKey);

    await this.channel.consume(queue, async (msg: any) => {
      if (!msg) return;

      try {
        await handler(msg);
        this.channel.ack(msg);
      } catch (error) {
        this.channel.nack(msg, false, false);
      }
    });
  }
}
