import type { DomainEvent } from "./domain-event";

export class AppointmentCancelledEvent implements DomainEvent {
  readonly eventName = "appointment.cancelled";
  readonly occurredAt = new Date();

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly reason?: string,
    public readonly cancelledBy?: string,
  ) {}
}
