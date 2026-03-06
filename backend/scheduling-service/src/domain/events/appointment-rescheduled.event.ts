import type { DomainEvent } from "./domain-event";

export class AppointmentRescheduledEvent implements DomainEvent {
  readonly eventName = "appointment.rescheduled";
  readonly occurredAt = new Date();

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly previousRoomId: string,
    public readonly newRoomId: string,
    public readonly previousStartAt: Date,
    public readonly previousEndAt: Date,
    public readonly newStartAt: Date,
    public readonly newEndAt: Date,
  ) {}
}
