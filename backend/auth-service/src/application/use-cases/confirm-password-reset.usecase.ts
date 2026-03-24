import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../domain/repositories/user.repository';
import { PasswordResetTokenRepository, RefreshTokenRepository } from '../../domain/repositories/token.repository';
import { Password } from '../../domain/value-objects/password.vo';
import { Either, left, right } from '../../domain/core/either';

export interface ConfirmPasswordResetDto {
  tokenRaw: string;
  newPasswordRaw: string;
}

@Injectable()
export class ConfirmPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly resetTokenRepository: PasswordResetTokenRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(dto: ConfirmPasswordResetDto): Promise<Either<Error, void>> {
    const tokenHash = crypto.createHash('sha256').update(dto.tokenRaw).digest('hex');
    
    const token = await this.resetTokenRepository.findByTokenHash(tokenHash);
    if (!token || !token.isValid()) {
      return left(new Error('INVALID_OR_EXPIRED_TOKEN'));
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      return left(new Error('USER_NOT_FOUND'));
    }

    const passwordVO = Password.create(dto.newPasswordRaw);
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(passwordVO.getValue(), saltRounds);

    user.passwordHash = passwordHash;
    token.markAsUsed();

    await this.userRepository.save(user);
    await this.resetTokenRepository.save(token);

    // Revoke all existing refresh tokens
    const activeRefreshTokens = await this.refreshTokenRepository.findActiveByUserId(user.id);
    for (const rt of activeRefreshTokens) {
      rt.revoke();
    }
    if (activeRefreshTokens.length > 0) {
      await this.refreshTokenRepository.saveMany(activeRefreshTokens);
    }
    
    // Publish auth.password.reset.completed if necessary
    return right(undefined);
  }
}
