import type { DomainEvent } from "./domain-event";

export class AppointmentCreatedEvent implements DomainEvent {
  readonly eventName = "appointment.created";
  readonly occurredAt = new Date();

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly roomId: string,
    public readonly startAt: Date,
    public readonly endAt: Date,
  ) {}
}
