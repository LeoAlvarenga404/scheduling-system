import { UserRole } from '../value-objects/user-enums';

export interface DomainEvent {
  eventId: string;
  correlationId: string;
  tenantId: string | null;
  occurredAt: Date;
  version: string;
}

export class UserRegisteredEvent implements DomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly correlationId: string,
    public readonly tenantId: string | null,
    public readonly userId: string,
    public readonly email: string,
    public readonly role: UserRole,
    public readonly verificationToken: string,
    public readonly occurredAt: Date = new Date(),
    public readonly version: string = '1.0',
  ) {}
}

export class UserVerifiedEvent implements DomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly correlationId: string,
    public readonly tenantId: string | null,
    public readonly userId: string,
    public readonly email: string,
    public readonly verifiedAt: Date = new Date(),
    public readonly occurredAt: Date = new Date(),
    public readonly version: string = '1.0',
  ) {}
}

export class UserLockedEvent implements DomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly correlationId: string,
    public readonly tenantId: string | null,
    public readonly userId: string,
    public readonly lockedUntil: Date,
    public readonly occurredAt: Date = new Date(),
    public readonly version: string = '1.0',
  ) {}
}

export class PasswordResetRequestedEvent implements DomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly correlationId: string,
    public readonly tenantId: string | null,
    public readonly userId: string,
    public readonly email: string,
    public readonly resetToken: string,
    public readonly expiresAt: Date,
    public readonly occurredAt: Date = new Date(),
    public readonly version: string = '1.0',
  ) {}
}

export class UserRoleChangedEvent implements DomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly correlationId: string,
    public readonly tenantId: string | null,
    public readonly userId: string,
    public readonly previousRole: UserRole,
    public readonly newRole: UserRole,
    public readonly changedBy: string,
    public readonly occurredAt: Date = new Date(),
    public readonly version: string = '1.0',
  ) {}
}

export class UserDeactivatedEvent implements DomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly correlationId: string,
    public readonly tenantId: string | null,
    public readonly userId: string,
    public readonly deactivatedBy: string,
    public readonly occurredAt: Date = new Date(),
    public readonly version: string = '1.0',
  ) {}
}
