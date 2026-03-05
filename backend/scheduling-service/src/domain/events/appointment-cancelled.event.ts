import { DomainEvent } from "./domain-event";

export class AppointmentCancelledEvent extends DomainEvent {
  eventName = "appointment.cancelled";

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly reason?: string,
    public readonly cancelledBy?: string,
  ) {
    super();
  }
}
