import { Injectable, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/token.repository';
import { UserRole, UserStatus } from '../../domain/value-objects/user-enums';
import { UserDeactivatedEvent } from '../../domain/events/domain-events';
import { Either, left, right } from '../../domain/core/either';

export interface DeactivateUserDto {
  adminId: string;
  adminRole: UserRole;
  adminTenantId: string | null;
  targetUserId: string;
}

@Injectable()
export class DeactivateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(dto: DeactivateUserDto): Promise<Either<Error, void>> {
    const targetUser = await this.userRepository.findById(dto.targetUserId);
    if (!targetUser) {
      return left(new Error('USER_NOT_FOUND'));
    }

    if (dto.adminRole === UserRole.MANAGER && targetUser.tenantId !== dto.adminTenantId) {
      return left(new Error('FORBIDDEN_CROSS_TENANT_ACTION'));
    }

    if (targetUser.id === dto.adminId) {
      return left(new Error('CANNOT_DEACTIVATE_OWN_ACCOUNT'));
    }

    targetUser.status = UserStatus.DEACTIVATED;
    targetUser.updatedAt = new Date();

    const event = new UserDeactivatedEvent(
      crypto.randomUUID(),
      crypto.randomUUID(),
      targetUser.tenantId,
      targetUser.id,
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
