import type { DomainEvent } from "./domain-event";

export class AppointmentCompletedEvent implements DomainEvent {
  readonly eventName = "appointment.completed";
  readonly occurredAt = new Date();

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
  ) {}
}
