import type { DomainEvent } from "src/domain/events/domain-event";

export abstract class DomainEventPublisher {
  abstract publish(events: DomainEvent[]): Promise<void>;
}
