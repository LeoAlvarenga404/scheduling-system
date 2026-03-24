export class PasswordResetToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public tokenHash: string,
    public expiresAt: Date,
    public usedAt: Date | null,
  ) {}

  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  public isUsed(): boolean {
    return this.usedAt !== null;
  }

  public isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  public markAsUsed(): void {
    if (this.isValid()) {
      this.usedAt = new Date();
    }
  }
}

export class EmailVerificationToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public tokenHash: string,
    public expiresAt: Date,
    public usedAt: Date | null,
  ) {}

  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  public isUsed(): boolean {
    return this.usedAt !== null;
  }

  public isValid(): boolean {
    return !this.isExpired() && !this.isUsed();
  }

  public markAsUsed(): void {
    if (this.isValid()) {
      this.usedAt = new Date();
    }
  }
}
