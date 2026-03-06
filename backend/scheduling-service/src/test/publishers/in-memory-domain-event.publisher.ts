import type { DomainEvent } from "src/domain/events/domain-event";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";

export class InMemoryDomainEventPublisher implements DomainEventPublisher {
  public readonly publishedEvents: DomainEvent[] = [];

  async publish(events: DomainEvent[]): Promise<void> {
    this.publishedEvents.push(...events);
  }
}

