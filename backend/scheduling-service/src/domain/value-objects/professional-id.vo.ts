import { ValueObject } from "../core/entities/value-object";
import { AppointmentValidationError } from "../errors/appointment-validation.error";

interface ProfessionalIdProps {
  value: string;
}

export class ProfessionalId extends ValueObject<ProfessionalIdProps> {
  private constructor(props: ProfessionalIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.value;
  }

  static create(value: string): ProfessionalId {
    if (!value?.trim()) {
      throw new AppointmentValidationError("responsibleProfessionalId is mandatory.");
    }

    return new ProfessionalId({ value: value.trim() });
  }
}
