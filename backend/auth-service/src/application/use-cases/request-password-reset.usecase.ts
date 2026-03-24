import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordResetTokenRepository } from '../../domain/repositories/token.repository';
import { PasswordResetRequestedEvent } from '../../domain/events/domain-events';
import { Either, left, right } from '../../domain/core/either';
import { PasswordResetToken } from '../../domain/entities/tokens.entity';
import { Email } from '../../domain/value-objects/email.vo';

export interface RequestPasswordResetDto {
  tenantId: string | null;
  email: string;
}

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly resetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(dto: RequestPasswordResetDto): Promise<Either<Error, void>> {
    const emailVO = Email.create(dto.email);
    const user = await this.userRepository.findByEmailAndTenant(emailVO.getValue(), dto.tenantId);
    
    // Always return success immediately to prevent user enumeration
    if (!user) {
      return right(undefined);
    }

    // Invalidate previous active tokens
    const activeTokens = await this.resetTokenRepository.findActiveByUserId(user.id);
    for (const token of activeTokens) {
      token.usedAt = new Date(); // soft mock 'used' to invalidate
    }
    if (activeTokens.length > 0) {
      await this.resetTokenRepository.saveMany(activeTokens);
    }

    const tokenId = crypto.randomUUID();
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const resetToken = new PasswordResetToken(
      tokenId,
      user.id,
      tokenHash,
      expiresAt,
      null,
    );

    const event = new PasswordResetRequestedEvent(
      crypto.randomUUID(),
      crypto.randomUUID(),
      user.tenantId,
      user.id,
      user.email,
      tokenRaw,
      expiresAt,
    );

    await this.resetTokenRepository.save(resetToken, [event]);
    return right(undefined);
  }
}
