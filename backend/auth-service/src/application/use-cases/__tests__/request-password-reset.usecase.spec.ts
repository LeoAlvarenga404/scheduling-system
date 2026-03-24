import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { RequestPasswordResetUseCase } from '../request-password-reset.usecase';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { PasswordResetTokenRepository } from '../../../domain/repositories/token.repository';

describe('RequestPasswordResetUseCase', () => {
  let useCase: RequestPasswordResetUseCase;
  let userRepo: Mocked<UserRepository>;
  let tokenRepo: Mocked<PasswordResetTokenRepository>;

  beforeEach(() => {
    userRepo = {
      findByEmailAndTenant: vi.fn(),
    } as any;
    tokenRepo = {
      save: vi.fn(),
      saveMany: vi.fn(),
      findActiveByUserId: vi.fn().mockResolvedValue([]),
    } as any;
    useCase = new RequestPasswordResetUseCase(userRepo, tokenRepo);
  });

  it('should request reset successfully', async () => {
    const user = { id: 'user-1', email: 'test@example.com' } as any;
    userRepo.findByEmailAndTenant.mockResolvedValue(user);

    const result = await useCase.execute({ email: 'test@example.com', tenantId: 'tenant-1' });

    expect(result.isRight()).toBe(true);
    expect(tokenRepo.save).toHaveBeenCalled();
  });

  it('should silent fail if user not found (security)', async () => {
    userRepo.findByEmailAndTenant.mockResolvedValue(null);
    const result = await useCase.execute({ email: 'notfound@example.com', tenantId: 'tenant-1' });
    expect(result.isRight()).toBe(true);
    expect(tokenRepo.save).not.toHaveBeenCalled();
  });
});
