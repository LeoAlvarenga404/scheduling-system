import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { LogoutUseCase } from '../logout.usecase';
import { RefreshTokenRepository } from '../../../domain/repositories/token.repository';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let tokenRepo: Mocked<RefreshTokenRepository>;

  beforeEach(() => {
    tokenRepo = {
      findByTokenHash: vi.fn(),
      save: vi.fn(),
    } as any;
    useCase = new LogoutUseCase(tokenRepo);
  });

  it('should logout successfully', async () => {
    const token = new RefreshToken('token-1', 'user-1', 'hash', new Date(), null, null, new Date(), null);
    tokenRepo.findByTokenHash.mockResolvedValue(token);

    const result = await useCase.execute({ refreshTokenRaw: 'token-raw' });
    expect(result.isRight()).toBe(true);

    expect(token.revokedAt).toBeDefined();
    expect(tokenRepo.save).toHaveBeenCalledWith(token);
  });

  it('should throw if token not found', async () => {
    tokenRepo.findByTokenHash.mockResolvedValue(null);
    const result = await useCase.execute({ refreshTokenRaw: 'invalid' });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('REFRESH_TOKEN_INVALID');
    expect(tokenRepo.save).not.toHaveBeenCalled();
  });
});
