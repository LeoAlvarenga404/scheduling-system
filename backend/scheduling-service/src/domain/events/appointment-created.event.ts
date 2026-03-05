import { DomainEvent } from "./domain-event";

export class AppointmentCreatedEvent extends DomainEvent {
  eventName = "appointment.created";

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly roomId: string,
    public readonly startAt: Date,
    public readonly endAt: Date,
  ) {
    super();
  }
}
