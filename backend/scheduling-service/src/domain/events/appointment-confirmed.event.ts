import { DomainEvent } from "./domain-event";

export class AppointmentConfirmedEvent extends DomainEvent {
  eventName = "appointment.confirmed";

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly paymentRef?: string,
  ) {
    super();
  }
}
