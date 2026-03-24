import { Injectable } from '@nestjs/common';
import { DomainEvent } from '../../domain/events/domain-events';
import { DomainEventPublisher } from '../../application/events/domain-event-publisher';
import { RabbitMQService } from './rabbitmq.service';

@Injectable()
export class RabbitMQDomainEventPublisher implements DomainEventPublisher {
  constructor(private readonly rabbitMQ: RabbitMQService) {}

  async publish(event: DomainEvent): Promise<void> {
    const routingKey = (event as any).constructor.name
      .replace(/Event$/, '')
      .replace(/([a-z])([A-Z])/g, '$1.$2')
      .toLowerCase();
    
    // For specific routing keys defined in PRD:
    // UserRegisteredEvent -> auth.user.registered
    const prdRoutingKey = `auth.${routingKey}`;
    
    await this.rabbitMQ.publish(prdRoutingKey, event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
