import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import * as crypto from 'node:crypto';
import { VerifyEmailUseCase } from '../verify-email.usecase';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { EmailVerificationTokenRepository } from '../../../domain/repositories/token.repository';
import { UserStatus } from '../../../domain/value-objects/user-enums';
import { EmailVerificationToken } from '../../../domain/entities/tokens.entity';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let userRepo: Mocked<UserRepository>;
  let tokenRepo: Mocked<EmailVerificationTokenRepository>;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    } as any;
    tokenRepo = {
      findByTokenHash: vi.fn(),
      save: vi.fn(),
    } as any;
    useCase = new VerifyEmailUseCase(userRepo, tokenRepo);
  });

  it('should verify email successfully', async () => {
    const tokenHash = 'some-hash';
    const userId = 'user-1';
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const token = new EmailVerificationToken('token-1', userId, tokenHash, expiresAt, null);
    tokenRepo.findByTokenHash.mockResolvedValue(token);

    const user = {
      id: userId,
      status: UserStatus.PENDING_VERIFICATION,
      verifyEmail: vi.fn(),
    } as any;
    userRepo.findById.mockResolvedValue(user);

    await useCase.execute({ tokenRaw: 'raw-token' });

    expect(user.verifyEmail).toHaveBeenCalled();
    expect(userRepo.save).toHaveBeenCalled();
    expect(token.usedAt).toBeDefined();
    expect(tokenRepo.save).toHaveBeenCalled();
  });

  it('should throw if token not found', async () => {
    tokenRepo.findByTokenHash.mockResolvedValue(null);
    const result = await useCase.execute({ tokenRaw: 'invalid' });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('INVALID_OR_EXPIRED_TOKEN');
  });

  it('should throw if token expired', async () => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() - 1);
    const token = new EmailVerificationToken('token-1', 'user-1', 'hash', expiresAt, null);
    tokenRepo.findByTokenHash.mockResolvedValue(token);

    const result = await useCase.execute({ tokenRaw: 'expired' });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('INVALID_OR_EXPIRED_TOKEN');
  });
});
