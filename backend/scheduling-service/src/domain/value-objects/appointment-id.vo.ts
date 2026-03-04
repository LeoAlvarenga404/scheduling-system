import { UniqueEntityID } from "../core/entities/unique-entity-id";
import { ValueObject } from "../core/entities/value-object";
import { AppointmentValidationError } from "../errors/appointment-validation.error";

interface AppointmentIdProps {
  value: string;
}

export class AppointmentId extends ValueObject<AppointmentIdProps> {
  private constructor(props: AppointmentIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.value;
  }

  toUniqueEntityID(): UniqueEntityID {
    return new UniqueEntityID(this.value);
  }

  static fromUniqueEntityID(id: UniqueEntityID): AppointmentId {
    return AppointmentId.create(id.toString());
  }

  static create(value: string): AppointmentId {
    if (!value?.trim()) {
      throw new AppointmentValidationError("appointmentId is mandatory.");
    }

    return new AppointmentId({ value: value.trim() });
  }
}
