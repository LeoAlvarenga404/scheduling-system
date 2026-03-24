import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/token.repository';
import { UserRole } from '../../domain/value-objects/user-enums';
import { UserRoleChangedEvent } from '../../domain/events/domain-events';
import { Either, left, right } from '../../domain/core/either';

export interface ChangeUserRoleDto {
  adminId: string;
  adminRole: UserRole;
  adminTenantId: string | null;
  targetUserId: string;
  newRole: UserRole;
}

@Injectable()
export class ChangeUserRoleUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(dto: ChangeUserRoleDto): Promise<Either<Error, void>> {
    const targetUser = await this.userRepository.findById(dto.targetUserId);
    if (!targetUser) {
      return left(new Error('USER_NOT_FOUND'));
    }

    // Validation: MANAGER can only change roles within their tenant
    if (dto.adminRole === UserRole.MANAGER) {
      if (targetUser.tenantId !== dto.adminTenantId) {
        return left(new Error('FORBIDDEN_CROSS_TENANT_ACTION'));
      }
      if (dto.newRole === UserRole.ADMIN) {
        return left(new Error('MANAGER_CANNOT_PROMOT_TO_ADMIN'));
      }
    }

    if (targetUser.id === dto.adminId) {
      return left(new Error('CANNOT_CHANGE_OWN_ROLE'));
    }

    const previousRole = targetUser.role;
    targetUser.role = dto.newRole;
    targetUser.updatedAt = new Date();

    const event = new UserRoleChangedEvent(
      crypto.randomUUID(),
      crypto.randomUUID(),
      targetUser.tenantId,
      targetUser.id,
      previousRole,
      dto.newRole,
      dto.adminId,
    );
    
    await this.userRepository.save(targetUser, [event]);

    // Constructively revoke active sessions
    const activeTokens = await this.refreshTokenRepository.findActiveByUserId(targetUser.id);
    if (activeTokens.length > 0) {
      activeTokens.forEach(t => t.revoke());
      await this.refreshTokenRepository.saveMany(activeTokens);
    }

    return right(undefined);
  }
}
