import { ValueObject } from "../core/entities/value-object";

export type Status = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface AppointmentStatusProps {
  status: Status;
}

export class AppointmentStatus extends ValueObject<AppointmentStatusProps> {
  private constructor(props: AppointmentStatusProps) {
    super(props);
  }

  get value(): Status {
    return this.props.status;
  }

  static create(status: Status = "PENDING") {
    return new AppointmentStatus({ status });
  }

  changeTo(status: Status): AppointmentStatus {
    return new AppointmentStatus({ status });
  }
}
