import { ValueObject } from "../core/entities/value-object";
import { AppointmentValidationError } from "../errors/appointment-validation.error";

interface RoomIdProps {
  value: string;
}

export class RoomId extends ValueObject<RoomIdProps> {
  private constructor(props: RoomIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.value;
  }

  static create(value: string): RoomId {
    if (!value?.trim()) {
      throw new AppointmentValidationError("roomId is mandatory.");
    }

    return new RoomId({ value: value.trim() });
  }
}
