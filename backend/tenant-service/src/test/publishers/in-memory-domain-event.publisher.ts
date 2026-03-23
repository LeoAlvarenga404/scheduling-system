import { DomainEventPublisher } from '../../application/events/domain-event-publisher';
import { DomainEvent } from '../../domain/events/tenant-events';

export class InMemoryDomainEventPublisher implements DomainEventPublisher {
  public publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.publishedEvents.push(...events);
  }
}
