import { 
  RefreshToken as PrismaRefreshToken,
  PasswordResetToken as PrismaPasswordResetToken,
  EmailVerificationToken as PrismaEmailVerificationToken
} from '@prisma/client';
import { RefreshToken } from '../../../../domain/entities/refresh-token.entity';
import { PasswordResetToken, EmailVerificationToken } from '../../../../domain/entities/tokens.entity';

export class PrismaTokenMapper {
  public static toRefreshTokenDomain(raw: PrismaRefreshToken): RefreshToken {
    return new RefreshToken(
      raw.id,
      raw.userId,
      raw.tokenHash,
      raw.expiresAt,
      raw.usedAt,
      raw.revokedAt,
      raw.createdAt,
      raw.replacedByTokenId,
    );
  }

  public static toRefreshTokenPersistence(entity: RefreshToken): PrismaRefreshToken {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      revokedAt: entity.revokedAt,
      createdAt: entity.createdAt,
      replacedByTokenId: entity.replacedByTokenId,
    };
  }

  public static toPasswordResetTokenDomain(raw: PrismaPasswordResetToken): PasswordResetToken {
    return new PasswordResetToken(raw.id, raw.userId, raw.tokenHash, raw.expiresAt, raw.usedAt);
  }

  public static toPasswordResetTokenPersistence(entity: PasswordResetToken): PrismaPasswordResetToken {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
    };
  }

  public static toEmailVerificationTokenDomain(raw: PrismaEmailVerificationToken): EmailVerificationToken {
    return new EmailVerificationToken(raw.id, raw.userId, raw.tokenHash, raw.expiresAt, raw.usedAt);
  }

  public static toEmailVerificationTokenPersistence(entity: EmailVerificationToken): PrismaEmailVerificationToken {
    return {
      id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
    };
  }
}
