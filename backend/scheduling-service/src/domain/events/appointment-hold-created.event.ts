import { DomainEvent } from "./domain-event";

export class AppointmentHoldCreatedEvent extends DomainEvent {
  eventName = "appointment.hold.created";

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
