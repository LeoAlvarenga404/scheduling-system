import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { ChangeUserRoleUseCase } from '../change-user-role.usecase';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../../domain/repositories/token.repository';
import { UserRole } from '../../../domain/value-objects/user-enums';

describe('ChangeUserRoleUseCase', () => {
  let useCase: ChangeUserRoleUseCase;
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
    useCase = new ChangeUserRoleUseCase(userRepo, rtRepo);
  });

  it('should change role successfully', async () => {
    const targetUser = { id: 'target', tenantId: 'tenant-1', role: UserRole.PATIENT } as any;
    userRepo.findById.mockResolvedValue(targetUser);
    
    const token = { revoke: vi.fn() } as any;
    rtRepo.findActiveByUserId.mockResolvedValue([token]);

    const result = await useCase.execute({
      adminId: 'admin',
      adminRole: UserRole.ADMIN,
      adminTenantId: null,
      targetUserId: 'target',
      newRole: UserRole.MANAGER,
    });

    expect(result.isRight()).toBe(true);

    expect(targetUser.role).toBe(UserRole.MANAGER);
    expect(userRepo.save).toHaveBeenCalled();
    expect(token.revoke).toHaveBeenCalled();
    expect(rtRepo.saveMany).toHaveBeenCalled();
  });

  it('should throw if target not found', async () => {
    userRepo.findById.mockResolvedValue(null);
    const result = await useCase.execute({
      adminId: 'a', adminRole: UserRole.ADMIN, adminTenantId: null, targetUserId: 't', newRole: UserRole.MANAGER
    });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('USER_NOT_FOUND');
  });

  it('should throw if forbidden cross-tenant action', async () => {
    const targetUser = { id: 'target', tenantId: 'tenant-2' } as any;
    userRepo.findById.mockResolvedValue(targetUser);

    const result = await useCase.execute({
      adminId: 'admin',
      adminRole: UserRole.MANAGER,
      adminTenantId: 'tenant-1',
      targetUserId: 'target',
      newRole: UserRole.PATIENT,
    });
    expect(result.isLeft()).toBe(true);
    expect((result.value as Error).message).toBe('FORBIDDEN_CROSS_TENANT_ACTION');
  });
});
