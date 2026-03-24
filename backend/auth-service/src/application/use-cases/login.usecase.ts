import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RefreshTokenRepository } from '../../domain/repositories/token.repository';
import { UserStatus } from '../../domain/value-objects/user-enums';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { UserLockedEvent } from '../../domain/events/domain-events';
import { Either, left, right } from '../../domain/core/either';

export interface LoginDto {
  tenantId: string | null;
  email: string;
  passwordRaw: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: LoginDto): Promise<Either<Error, LoginResult>> {
    const user = await this.userRepository.findByEmailAndTenant(dto.email, dto.tenantId);
    
    if (!user) {
      return left(new Error('INVALID_CREDENTIALS'));
    }

    if (user.status === UserStatus.PENDING_VERIFICATION) {
      return left(new Error('EMAIL_NOT_VERIFIED'));
    }

    if (user.status === UserStatus.DEACTIVATED) {
      return left(new Error('INVALID_CREDENTIALS'));
    }

    if (user.isLocked()) {
      return left(new Error('ACCOUNT_LOCKED'));
    }

    const passwordMatches = await bcrypt.compare(dto.passwordRaw, user.passwordHash);

    if (!passwordMatches) {
      user.recordFailedLogin();
      
      let events: UserLockedEvent[] = [];
      if (user.isLocked() && user.lockedUntil) {
        const event = new UserLockedEvent(
          crypto.randomUUID(),
          crypto.randomUUID(),
          user.tenantId,
          user.id,
          user.lockedUntil,
        );
        events.push(event);
      }
      
      await this.userRepository.save(user, events);
      return left(new Error('INVALID_CREDENTIALS'));
    }

    user.recordSuccessfulLogin();
    await this.userRepository.save(user);

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };
    
    const expiresIn = 900; // 15 minutes
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    const refreshTokenRaw = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenEntity = new RefreshToken(
      crypto.randomUUID(),
      user.id,
      tokenHash,
      expiresAt,
      null,
      null,
      new Date(),
      null,
    );

    await this.refreshTokenRepository.save(refreshTokenEntity);

    return right({
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn,
    });
  }
}
