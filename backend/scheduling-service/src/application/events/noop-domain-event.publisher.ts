import type { DomainEvent } from "src/domain/events/domain-event";
import { DomainEventPublisher } from "./domain-event-publisher";

export class NoopDomainEventPublisher implements DomainEventPublisher {
  async publish(_events: DomainEvent[]): Promise<void> {
    return;
  }
}
