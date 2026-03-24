import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { DeactivateUserUseCase } from '../deactivate-user.usecase';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../../domain/repositories/token.repository';
import { UserRole, UserStatus } from '../../../domain/value-objects/user-enums';

describe('DeactivateUserUseCase', () => {
  let useCase: DeactivateUserUseCase;
  let userRepo: Mocked<UserRepository>;
  let rtRepo: Mocked<RefreshTokenRepository>;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      save: vi.fn(),
    } as any;
    rtRepo = {
      findActiveByUserId: vi.fn(),
      saveMany: vi.fn(),
    } as any;
    useCase = new DeactivateUserUseCase(userRepo, rtRepo);
  });

  it('should deactivate user successfully', async () => {
    const targetUser = { id: 'target', tenantId: 'tenant-1', status: UserStatus.ACTIVE } as any;
    userRepo.findById.mockResolvedValue(targetUser);
    
    const token = { revoke: vi.fn() } as any;
    rtRepo.findActiveByUserId.mockResolvedValue([token]);

    const result = await useCase.execute({
      adminId: 'admin',
      adminRole: UserRole.MANAGER,
      adminTenantId: 'tenant-1',
      targetUserId: 'target',
    });

    expect(result.isRight()).toBe(true);

    expect(targetUser.status).toBe(UserStatus.DEACTIVATED);
    expect(userRepo.save).toHaveBeenCalled();
    expect(token.revoke).toHaveBeenCalled();
    expect(rtRepo.saveMany).toHaveBeenCalled();
  });

  it('should throw if unauthorized tenant', async () => {
    const targetUser = { id: 'target', tenantId: 'tenant-2' } as any;
    userRepo.findById.mockResolvedValue(targetUser);

    const result = await useCase.execute({
      adminId: 'admin',
      adminRole: UserRole.MANAGER,
      adminTenantId: 'tenant-1',
      targetUserId: 'target',
    });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('FORBIDDEN_CROSS_TENANT_ACTION');
  });
});
