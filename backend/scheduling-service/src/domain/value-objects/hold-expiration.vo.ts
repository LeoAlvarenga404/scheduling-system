import { ValueObject } from "../core/entities/value-object";
import { AppointmentValidationError } from "../errors/appointment-validation.error";

interface HoldExpirationProps {
  value: Date;
}

export class HoldExpiration extends ValueObject<HoldExpirationProps> {
  private constructor(props: HoldExpirationProps) {
    super(props);
  }

  get value(): Date {
    return new Date(this.props.value.getTime());
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.value.getTime() <= now.getTime();
  }

  static create(value: Date): HoldExpiration {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new AppointmentValidationError("holdExpiresAt must be a valid Date.");
    }

    return new HoldExpiration({
      value: new Date(value.getTime()),
    });
  }
}
