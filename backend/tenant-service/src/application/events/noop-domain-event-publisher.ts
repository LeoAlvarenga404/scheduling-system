import { DomainEvent } from '../../domain/events/tenant-events';
import { DomainEventPublisher } from './domain-event-publisher';

export class NoopDomainEventPublisher implements DomainEventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    // No-op
  }
  async publishAll(events: DomainEvent[]): Promise<void> {
    // No-op
  }
}
