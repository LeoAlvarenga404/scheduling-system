import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { connect, type Channel, type Connection } from "amqplib";
import type { DomainEvent } from "src/domain/events/domain-event";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";

@Injectable()
export class RabbitMqDomainEventPublisher
  implements DomainEventPublisher, OnModuleDestroy
{
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  private readonly rabbitMqUrl =
    process.env.RABBITMQ_URL ?? "amqp://localhost:5672";
  private readonly exchange =
    process.env.RABBITMQ_EXCHANGE ?? "scheduling.domain.events";

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = null;
    this.connection = null;
  }

  async publish(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const channel = await this.ensureConnection();

    for (const event of events) {
      const payload = Buffer.from(JSON.stringify(event));

      channel.publish(this.exchange, event.eventName, payload, {
        persistent: true,
        contentType: "application/json",
        type: event.eventName,
        timestamp: event.occurredAt.getTime(),
      });
    }
  }

  private async ensureConnection(): Promise<Channel> {
    if (this.channel) {
      return this.channel;
    }

    this.connection = await connect(this.rabbitMqUrl);
    this.channel = await this.connection.createChannel();
    await this.channel.assertExchange(this.exchange, "topic", {
      durable: true,
    });

    return this.channel;
  }
}
