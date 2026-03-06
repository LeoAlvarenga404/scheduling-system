import type { DomainEvent } from "./domain-event";

export class AppointmentExpiredEvent implements DomainEvent {
  readonly eventName = "appointment.expired";
  readonly occurredAt = new Date();

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
  ) {}
}
