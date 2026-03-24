export class Email {
  private constructor(private readonly value: string) {}

  public static create(value: string): Email {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email format');
    }
    return new Email(value);
  }

  public getValue(): string {
    return this.value;
  }
}
