import { DomainEvent } from "./domain-event";

export class AppointmentCompletedEvent extends DomainEvent {
  eventName = "appointment.completed";

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
  ) {
    super();
  }
}
