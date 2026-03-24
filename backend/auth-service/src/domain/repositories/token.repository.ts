import { RefreshToken } from '../entities/refresh-token.entity';
import { PasswordResetToken, EmailVerificationToken } from '../entities/tokens.entity';
import { DomainEvent } from '../events/domain-events';

export abstract class RefreshTokenRepository {
  abstract findById(id: string): Promise<RefreshToken | null>;
  abstract findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  abstract findActiveByUserId(userId: string): Promise<RefreshToken[]>;
  abstract save(token: RefreshToken, events?: DomainEvent[]): Promise<void>;
  abstract saveMany(tokens: RefreshToken[], events?: DomainEvent[]): Promise<void>;
}

export abstract class PasswordResetTokenRepository {
  abstract findByTokenHash(tokenHash: string): Promise<PasswordResetToken | null>;
  abstract findActiveByUserId(userId: string): Promise<PasswordResetToken[]>;
  abstract save(token: PasswordResetToken, events?: DomainEvent[]): Promise<void>;
  abstract saveMany(tokens: PasswordResetToken[], events?: DomainEvent[]): Promise<void>;
}

export abstract class EmailVerificationTokenRepository {
  abstract findByTokenHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  abstract save(token: EmailVerificationToken, events?: DomainEvent[]): Promise<void>;
}
