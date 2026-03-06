import type { DomainEvent } from "./domain-event";

export class AppointmentConfirmedEvent implements DomainEvent {
  readonly eventName = "appointment.confirmed";
  readonly occurredAt = new Date();

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly paymentRef?: string,
  ) {}
}
