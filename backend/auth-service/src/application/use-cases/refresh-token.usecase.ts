import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenRepository } from '../../domain/repositories/token.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { UserStatus } from '../../domain/value-objects/user-enums';
import { Either, left, right } from '../../domain/core/either';

export interface RefreshTokenDto {
  refreshTokenRaw: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<Either<Error, RefreshTokenResult>> {
    const tokenHash = crypto.createHash('sha256').update(dto.refreshTokenRaw).digest('hex');
    
    const token = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    
    if (!token) {
      return left(new Error('REFRESH_TOKEN_INVALID'));
    }

    if (token.isUsed() || token.isRevoked() || token.isExpired()) {
      // If token is already used, we suspect token theft and revoke the whole chain.
      if (token.isUsed() && !token.isRevoked()) {
        const activeTokens = await this.refreshTokenRepository.findActiveByUserId(token.userId);
        for (const activeToken of activeTokens) {
          activeToken.revoke();
        }
        await this.refreshTokenRepository.saveMany(activeTokens);
        // Ideally publish an auth.suspicious.activity event here
      }
      return left(new Error('REFRESH_TOKEN_INVALID'));
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user || user.status !== UserStatus.ACTIVE) {
      return left(new Error('ACCOUNT_INACTIVE_OR_LOCKED'));
    }

    token.markAsUsed();

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };
    
    const expiresIn = 900;
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    const newRefreshTokenRaw = crypto.randomUUID();
    const newTokenHash = crypto.createHash('sha256').update(newRefreshTokenRaw).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const newRefreshToken = new RefreshToken(
      crypto.randomUUID(),
      user.id,
      newTokenHash,
      expiresAt,
      null,
      null,
      new Date(),
      token.id,
    );

    await this.refreshTokenRepository.save(token);
    await this.refreshTokenRepository.save(newRefreshToken);

    return right({
      accessToken,
      refreshToken: newRefreshTokenRaw,
      expiresIn,
    });
  }
}
