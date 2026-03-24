import { DomainEvent } from '../../domain/events/domain-events';

export abstract class DomainEventPublisher {
  abstract publish(event: DomainEvent): Promise<void>;
  abstract publishAll(events: DomainEvent[]): Promise<void>;
}
