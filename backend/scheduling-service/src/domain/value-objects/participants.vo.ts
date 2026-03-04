import { ValueObject } from "../core/entities/value-object";
import { AppointmentValidationError } from "../errors/appointment-validation.error";
import { ProfessionalId } from "./professional-id.vo";

interface ParticipantsProps {
  professionals: ReadonlyArray<ProfessionalId>;
}

export class Participants extends ValueObject<ParticipantsProps> {
  private constructor(props: ParticipantsProps) {
    super(props);
  }

  get professionals(): ProfessionalId[] {
    return [...this.props.professionals];
  }

  contains(id: ProfessionalId): boolean {
    return this.props.professionals.some((professional) =>
      professional.equals(id),
    );
  }

  toValues(): string[] {
    return this.props.professionals.map((professional) => professional.value);
  }

  static create(professionals: ProfessionalId[]): Participants {
    const normalizedProfessionals = [...(professionals ?? [])];
    const unique = new Set(normalizedProfessionals.map((p) => p.value));

    if (unique.size !== normalizedProfessionals.length) {
      throw new AppointmentValidationError("Duplicate participants");
    }

    return new Participants({
      professionals: Object.freeze(normalizedProfessionals),
    });
  }
}
