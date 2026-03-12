import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { connect, type ConfirmChannel, type Connection } from "amqplib";
import type { DomainEvent } from "src/domain/events/domain-event";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";

@Injectable()
export class RabbitMqDomainEventPublisher
  implements DomainEventPublisher, OnModuleDestroy
{
  private connection: Connection | null = null;
  private channel: ConfirmChannel | null = null;
  private connecting: Promise<ConfirmChannel> | null = null;

  private readonly rabbitMqUrl = process.env.RABBITMQ_URL;
  private readonly exchange = process.env.RABBITMQ_EXCHANGE;

  constructor() {
    if (!this.rabbitMqUrl) {
      throw new Error("RABBITMQ_URL não definida");
    }

    if (!this.exchange) {
      throw new Error("RABBITMQ_EXCHANGE não definida");
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.channel?.close();
    } catch {}

    try {
      await this.connection?.close();
    } catch {}

    this.channel = null;
    this.connection = null;
    this.connecting = null;
  }

  async publish(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return;

    const channel = await this.ensureConnection();

    for (const event of events) {
      const payload = Buffer.from(
        JSON.stringify({
          ...event,
          eventName: event.eventName,
          occurredAt: event.occurredAt.toISOString(),
        }),
      );

      channel.publish(this.exchange, event.eventName, payload, {
        persistent: true,
        contentType: "application/json",
        type: event.eventName,
        timestamp: event.occurredAt.getTime(),
      });
    }

    await channel.waitForConfirms();
  }

  private async ensureConnection(): Promise<ConfirmChannel> {
    if (this.channel) return this.channel;
    if (this.connecting) return this.connecting;

    this.connecting = (async () => {
      const connection = await connect(this.rabbitMqUrl!);
      const channel = await connection.createConfirmChannel();

      connection.on("close", () => {
        this.connection = null;
        this.channel = null;
        this.connecting = null;
      });

      connection.on("error", () => {
        this.connection = null;
        this.channel = null;
        this.connecting = null;
      });

      await channel.assertExchange(this.exchange!, "topic", {
        durable: true,
      });

      this.connection = connection;
      this.channel = channel;

      return channel;
    })();

    return this.connecting;
  }
}
