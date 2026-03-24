import { User as PrismaUser, UserRole as PrismaUserRole, UserStatus as PrismaUserStatus } from '@prisma/client';
import { User } from '../../../../domain/entities/user.entity';
import { UserRole, UserStatus } from '../../../../domain/value-objects/user-enums';

export class PrismaUserMapper {
  public static toDomain(raw: PrismaUser): User {
    return new User(
      raw.id,
      raw.tenantId,
      raw.email,
      raw.passwordHash,
      raw.role as unknown as UserRole,
      raw.status as unknown as UserStatus,
      raw.failedLoginAttempts,
      raw.lockedUntil,
      raw.emailVerifiedAt,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  public static toPersistence(user: User): PrismaUser {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as unknown as PrismaUserRole,
      status: user.status as unknown as PrismaUserStatus,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
