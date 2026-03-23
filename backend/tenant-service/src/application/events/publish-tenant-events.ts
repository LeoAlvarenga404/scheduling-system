import { Tenant } from '../../domain/entities/tenant';
import { DomainEventPublisher } from './domain-event-publisher';

export async function publishTenantEvents(
  tenant: Tenant,
  publisher: DomainEventPublisher
): Promise<void> {
  const events = tenant.domainEvents;
  if (events.length > 0) {
    await publisher.publishAll(events);
    tenant.clearEvents();
  }
}
