import { DomainEvent } from "./domain-event";

export class AppointmentRescheduledEvent extends DomainEvent {
  eventName = "appointment.rescheduled";

  constructor(
    public readonly appointmentId: string,
    public readonly tenantId: string,
    public readonly previousRoomId: string,
    public readonly newRoomId: string,
    public readonly previousStartAt: Date,
    public readonly previousEndAt: Date,
    public readonly newStartAt: Date,
    public readonly newEndAt: Date,
  ) {
    super();
  }
}
