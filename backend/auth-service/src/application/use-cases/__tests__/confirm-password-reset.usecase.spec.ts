import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { ConfirmPasswordResetUseCase } from '../confirm-password-reset.usecase';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { PasswordResetTokenRepository, RefreshTokenRepository } from '../../../domain/repositories/token.repository';
import { PasswordResetToken } from '../../../domain/entities/tokens.entity';
import * as bcrypt from 'bcrypt';
import { User } from '../../../domain/entities/user.entity';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

describe('ConfirmPasswordResetUseCase', () => {
  let useCase: ConfirmPasswordResetUseCase;
  let userRepo: Mocked<UserRepository>;
  let tokenRepo: Mocked<PasswordResetTokenRepository>;
  let rtRepo: Mocked<RefreshTokenRepository>;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    } as any;
    tokenRepo = {
      findByTokenHash: vi.fn(),
      save: vi.fn(),
    } as any;
    rtRepo = {
      findActiveByUserId: vi.fn(),
      saveMany: vi.fn(),
    } as any;
    useCase = new ConfirmPasswordResetUseCase(userRepo, tokenRepo, rtRepo);
  });

  it('should confirm reset successfully', async () => {
    const expiresAt = new Date(Date.now() + 3600000);
    const token = new PasswordResetToken('token-1', 'user-1', 'hash', expiresAt, null);
    tokenRepo.findByTokenHash.mockResolvedValue(token);

    const user = {
      id: 'user-1',
      passwordHash: 'old',
      updatedAt: new Date(),
    } as any;
    userRepo.findById.mockResolvedValue(user);
    
    const rtToken = { revoke: vi.fn() } as any;
    rtRepo.findActiveByUserId.mockResolvedValue([rtToken]);
    (bcrypt.hash as any).mockResolvedValue('new-hashed');

    const result = await useCase.execute({ tokenRaw: 'raw', newPasswordRaw: 'new-P@ssword123' });

    expect(result.isRight()).toBe(true);

    expect(user.passwordHash).toBe('new-hashed');
    expect(userRepo.save).toHaveBeenCalled();
    expect(token.usedAt).toBeDefined();
    expect(tokenRepo.save).toHaveBeenCalled();
    expect(rtToken.revoke).toHaveBeenCalled();
    expect(rtRepo.saveMany).toHaveBeenCalled();
  });

  it('should throw if token invalid or reused', async () => {
    tokenRepo.findByTokenHash.mockResolvedValue(null);
    const result = await useCase.execute({ tokenRaw: 'inv', newPasswordRaw: 'pw' });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('INVALID_OR_EXPIRED_TOKEN');
  });
});
