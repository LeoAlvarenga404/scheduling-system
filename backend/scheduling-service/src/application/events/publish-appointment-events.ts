import { DomainEventPublisher } from "./domain-event-publisher";
import type { Appointment } from "src/domain/entities/appointment";

export async function publishAppointmentEvents(
  appointment: Appointment,
  eventPublisher: DomainEventPublisher,
): Promise<void> {
  const events = appointment.pullDomainEvents();

  if (events.length === 0) {
    return;
  }

  await eventPublisher.publish(events);
}
