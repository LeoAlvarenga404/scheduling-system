import * as crypto from 'crypto';

export class Password {
  private constructor(private readonly value: string) {}

  public static create(value: string): Password {
    if (value.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(value)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(value)) {
      throw new Error('Password must contain at least one number');
    }
    return new Password(value);
  }

  public getValue(): string {
    return this.value;
  }
}
