import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma/prisma.service';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private isProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processOutboxEvents() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const batchSize = Number(process.env.OUTBOX_BATCH_SIZE) || 100;
      
      const events = await this.prisma.outboxEvent.findMany({
        where: {
          publishedAt: null,
        },
        orderBy: {
          occurredAt: 'asc',
        },
        take: batchSize,
      });

      if (events.length === 0) {
        return;
      }

      this.logger.log(`Processing ${events.length} outbox events`);

      for (const event of events) {
        try {
          // Assume the exchange is 'scheduling' and routing key is eventType. E.g. appointment.hold.created
          const published = await this.rabbitMQService.publish(
            event.eventType,
            event.payload,
          );

          if (published) {
            await this.prisma.outboxEvent.update({
              where: { id: event.id },
              data: { publishedAt: new Date() },
            });
          } else {
             this.logger.warn(`Failed to publish event ${event.id} to RabbitMQ (returned false)`);
          }
        } catch (error) {
          this.logger.error(`Error processing outbox event ${event.id}:`, error);
          // Let it fail and retry next time
        }
      }
    } catch (error) {
      this.logger.error('Error during outbox processing batch:', error);
    } finally {
      this.isProcessing = false;
    }
  }
}
