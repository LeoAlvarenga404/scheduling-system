export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public tokenHash: string,
    public expiresAt: Date,
    public usedAt: Date | null,
    public revokedAt: Date | null,
    public readonly createdAt: Date,
    public replacedByTokenId: string | null,
  ) {}

  public isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  public isUsed(): boolean {
    return this.usedAt !== null;
  }

  public isRevoked(): boolean {
    return this.revokedAt !== null;
  }

  public isValid(): boolean {
    return !this.isExpired() && !this.isUsed() && !this.isRevoked();
  }

  public markAsUsed(): void {
    if (this.isValid()) {
      this.usedAt = new Date();
    }
  }

  public revoke(): void {
    this.revokedAt = new Date();
  }
}
