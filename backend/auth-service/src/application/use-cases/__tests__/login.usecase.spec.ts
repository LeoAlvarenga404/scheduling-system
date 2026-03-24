import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { LoginUseCase } from '../login.usecase';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../../domain/repositories/token.repository';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '../../../domain/value-objects/user-enums';

vi.mock('bcrypt', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepo: Mocked<UserRepository>;
  let tokenRepo: Mocked<RefreshTokenRepository>;
  let jwtService: Mocked<JwtService>;

  beforeEach(() => {
    userRepo = {
      findByEmailAndTenant: vi.fn(),
      save: vi.fn(),
    } as any;
    tokenRepo = {
      save: vi.fn(),
    } as any;
    jwtService = {
      signAsync: vi.fn(),
    } as any;
    useCase = new LoginUseCase(userRepo, tokenRepo, jwtService);
  });

  it('should login successfully', async () => {
    const user = {
      id: 'user-1',
      tenantId: 'tenant-1',
      status: UserStatus.ACTIVE,
      passwordHash: 'hashed',
      recordFailedLogin: vi.fn(),
      recordSuccessfulLogin: vi.fn(),
      isLocked: vi.fn().mockReturnValue(false),
      role: 'PATIENT',
    } as any;

    userRepo.findByEmailAndTenant.mockResolvedValue(user);
    (bcrypt.compare as any).mockResolvedValue(true);
    jwtService.signAsync.mockResolvedValue('access-token');

    const result = await useCase.execute({
      email: 'test@example.com',
      passwordRaw: 'password',
      tenantId: 'tenant-1',
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.accessToken).toBe('access-token');
      expect(result.value.refreshToken).toBeDefined();
    }
    expect(user.recordSuccessfulLogin).toHaveBeenCalled();
    expect(tokenRepo.save).toHaveBeenCalled();
  });

  it('should throw if invalid credentials', async () => {
    userRepo.findByEmailAndTenant.mockResolvedValue(null);
    const result = await useCase.execute({
      email: 'test@example.com',
      passwordRaw: 'wrong',
      tenantId: 'tenant-1',
    });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('INVALID_CREDENTIALS');
  });

  it('should throw if user is locked', async () => {
    const user = {
      isLocked: vi.fn().mockReturnValue(true),
    } as any;
    userRepo.findByEmailAndTenant.mockResolvedValue(user);

    const result = await useCase.execute({
      email: 'test@example.com',
      passwordRaw: 'any',
      tenantId: 'tenant-1',
    });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('ACCOUNT_LOCKED');
  });
});
