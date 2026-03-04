import { ValueObject } from "../core/entities/value-object";
import { AppointmentValidationError } from "../errors/appointment-validation.error";

interface TimeSlotProps {
  start: Date;
  end: Date;
}

export class TimeSlot extends ValueObject<TimeSlotProps> {
  private constructor(props: TimeSlotProps) {
    super(props);
  }

  get start(): Date {
    return new Date(this.props.start.getTime());
  }

  get end(): Date {
    return new Date(this.props.end.getTime());
  }

  overlaps(other: TimeSlot): boolean {
    return (
      this.props.start.getTime() < other.props.end.getTime() &&
      other.props.start.getTime() < this.props.end.getTime()
    );
  }

  durationMinutes(): number {
    return (this.props.end.getTime() - this.props.start.getTime()) / 60000;
  }

  static create(start: Date, end: Date): TimeSlot {
    if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
      throw new AppointmentValidationError("startAt must be a valid Date.");
    }

    if (!(end instanceof Date) || Number.isNaN(end.getTime())) {
      throw new AppointmentValidationError("endAt must be a valid Date.");
    }

    if (end.getTime() <= start.getTime()) {
      throw new AppointmentValidationError("Invalid interval");
    }

    return new TimeSlot({
      start: new Date(start.getTime()),
      end: new Date(end.getTime()),
    });
  }
}
