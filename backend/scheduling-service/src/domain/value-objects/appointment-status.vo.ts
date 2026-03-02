import { ValueObject } from "../core/entities/value-object";

export type Status = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface AppointmentStatusProps {
  status: Status;
}

export class AppointmentStatus extends ValueObject<AppointmentStatusProps> {
  get status(): Status {
    return this.props.status;
  }

  changeTo(status: Status) {
    this.props.status = status;
  }
  static create(status: Status) {
    return new AppointmentStatus({ status });
  }
}
