import { describe, it, expect } from 'vitest';
import { User } from '../user.entity';
import { UserRole, UserStatus } from '../../value-objects/user-enums';

describe('User Entity', () => {
  it('should create a new user correctly', () => {
    const user = new User(
      'user-1',
      'tenant-1',
      'test@example.com',
      'hashed-password',
      UserRole.PATIENT,
      UserStatus.PENDING_VERIFICATION,
      0,
      null,
      null,
      new Date(),
      new Date()
    );

    expect(user.id).toBe('user-1');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe(UserRole.PATIENT);
    expect(user.status).toBe(UserStatus.PENDING_VERIFICATION);
  });

  it('should lock account after too many failed attempts', () => {
    const user = new User(
      'user-1',
      'tenant-1',
      'test@example.com',
      'hashed-password',
      UserRole.PATIENT,
      UserStatus.ACTIVE,
      0,
      null,
      null,
      new Date(),
      new Date()
    );

    // Default lock is after 5 attempts
    for (let i = 0; i < 5; i++) {
      user.recordFailedLogin();
    }

    expect(user.failedLoginAttempts).toBe(5);
    expect(user.isLocked()).toBe(true);
    expect(user.lockedUntil).toBeDefined();
  });

  it('should mark email as verified', () => {
    const user = new User(
      'user-1',
      'tenant-1',
      'test@example.com',
      'hashed-password',
      UserRole.PATIENT,
      UserStatus.PENDING_VERIFICATION,
      0,
      null,
      null,
      new Date(),
      new Date()
    );

    user.verifyEmail();

    expect(user.status).toBe(UserStatus.ACTIVE);
    expect(user.emailVerifiedAt).toBeDefined();
  });
});
