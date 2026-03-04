import { ValueObject } from "../core/entities/value-object";
import { AppointmentValidationError } from "../errors/appointment-validation.error";

interface TenantIdProps {
  value: string;
}

export class TenantId extends ValueObject<TenantIdProps> {
  private constructor(props: TenantIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.value;
  }

  static create(value: string): TenantId {
    if (!value?.trim()) {
      throw new AppointmentValidationError("tenantId is mandatory.");
    }

    return new TenantId({ value: value.trim() });
  }
}
