import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { RefreshTokenUseCase } from '../refresh-token.usecase';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../../domain/repositories/token.repository';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from '../../../domain/entities/refresh-token.entity';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let userRepo: Mocked<UserRepository>;
  let tokenRepo: Mocked<RefreshTokenRepository>;
  let jwtService: Mocked<JwtService>;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
    } as any;
    tokenRepo = {
      findByTokenHash: vi.fn(),
      save: vi.fn(),
      saveMany: vi.fn(),
      findActiveByUserId: vi.fn(),
    } as any;
    jwtService = {
      signAsync: vi.fn(),
    } as any;
    useCase = new RefreshTokenUseCase(tokenRepo, userRepo, jwtService);
  });

  it('should refresh token successfully', async () => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    
    const oldToken = new RefreshToken('token-1', 'user-1', 'old-hash', expiresAt, null, null, new Date(), null);
    tokenRepo.findByTokenHash.mockResolvedValue(oldToken);

    const user = { id: 'user-1', tenantId: 'tenant-1', role: 'PATIENT', status: 'ACTIVE' } as any;
    userRepo.findById.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValue('new-access-token');

    const result = await useCase.execute({ refreshTokenRaw: 'old-token' });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.accessToken).toBe('new-access-token');
      expect(result.value.refreshToken).toBeDefined();
    }
    expect(oldToken.usedAt).toBeDefined();
    expect(tokenRepo.save).toHaveBeenCalled();
  });

  it('should revoke for reuse detection', async () => {
    const future = new Date(Date.now() + 86400000);
    const oldToken = new RefreshToken('token-1', 'user-1', 'hash', future, new Date(), null, new Date(), null);
    tokenRepo.findByTokenHash.mockResolvedValue(oldToken);
    
    const activeTokens = [oldToken];
    tokenRepo.findActiveByUserId.mockResolvedValue(activeTokens as any);

    const result = await useCase.execute({ refreshTokenRaw: 'reused-token' });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('REFRESH_TOKEN_INVALID');
    expect(tokenRepo.saveMany).toHaveBeenCalled();
  });
});
