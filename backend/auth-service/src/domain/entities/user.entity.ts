import { UserRole, UserStatus } from '../value-objects/user-enums';

export class User {
  constructor(
    public readonly id: string,
    public tenantId: string | null,
    public email: string,
    public passwordHash: string,
    public role: UserRole,
    public status: UserStatus,
    public failedLoginAttempts: number,
    public lockedUntil: Date | null,
    public emailVerifiedAt: Date | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  public isLocked(): boolean {
    return this.status === UserStatus.LOCKED && this.lockedUntil !== null && this.lockedUntil > new Date();
  }

  public recordFailedLogin(): void {
    this.failedLoginAttempts += 1;
    if (this.failedLoginAttempts >= 5) {
      this.status = UserStatus.LOCKED;
      const lockedUntil = new Date();
      lockedUntil.setMinutes(lockedUntil.getMinutes() + 30);
      this.lockedUntil = lockedUntil;
    }
    this.updatedAt = new Date();
  }

  public recordSuccessfulLogin(): void {
    this.failedLoginAttempts = 0;
    if (this.status === UserStatus.LOCKED && this.lockedUntil && this.lockedUntil <= new Date()) {
      this.status = UserStatus.ACTIVE;
      this.lockedUntil = null;
    }
    this.updatedAt = new Date();
  }

  public verifyEmail(): void {
    if (this.status === UserStatus.PENDING_VERIFICATION) {
      this.status = UserStatus.ACTIVE;
      this.emailVerifiedAt = new Date();
      this.updatedAt = new Date();
    }
  }
}
