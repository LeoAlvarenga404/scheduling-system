import { DomainEvent } from "./domain-event";

export class AppointmentExpiredEvent extends DomainEvent {
  eventName = "appointment.expired";

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
  ) {
    super();
  }
}
