import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma/prisma.service';
import { RabbitMQPublisher } from './rabbitmq.publisher';

@Injectable()
export class OutboxWorker {
  private readonly logger = new Logger(OutboxWorker.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: RabbitMQPublisher,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutboxEvents() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Fetch up to 100 pending events
      const events = await this.prisma.outboxEvent.findMany({
        where: { publishedAt: null },
        orderBy: { occurredAt: 'asc' },
        take: 100,
      });

      if (events.length === 0) {
        return;
      }

      this.logger.debug(`Found ${events.length} pending outbox events.`);

      for (const event of events) {
        // Map event type to routing key as per PRD
        const routingKey = this.getRoutingKey(event.eventType);

        // Standardize event envelope
        const payload = {
          metadata: {
            eventId: event.id,
            eventType: event.eventType,
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            occurredAt: event.occurredAt.toISOString(),
            correlationId: event.correlationId,
            version: event.version,
          },
          data: event.payload,
        };

        const success = await this.publisher.publish(routingKey, payload);

        if (success) {
          // Mark as published
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              publishedAt: new Date(),
            },
          });
        } else {
          this.logger.warn(`Failed to publish event ${event.id} to RabbitMQ. Will retry later.`);
          // Keeping publishedAt: null will make it retry in the next tick
        }
      }
    } catch (error) {
      this.logger.error('Error processing outbox events', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private getRoutingKey(eventType: string): string {
    const mappings: Record<string, string> = {
      'TenantCreatedEvent': 'tenant.created',
      'TenantActivatedEvent': 'tenant.activated',
      'TenantSuspendedEvent': 'tenant.suspended',
      'TenantReactivatedEvent': 'tenant.reactivated',
      'TenantCancelledEvent': 'tenant.cancelled',
      'TenantPlanChangedEvent': 'tenant.plan_changed',
    };
    return mappings[eventType] || `tenant.unknown.${eventType.toLowerCase()}`;
  }
}
