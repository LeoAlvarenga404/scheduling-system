import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { RefreshTokenRepository } from '../../domain/repositories/token.repository';
import { Either, left, right } from '../../domain/core/either';

export interface LogoutDto {
  refreshTokenRaw: string;
  allDevices?: boolean;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(dto: LogoutDto): Promise<Either<Error, void>> {
    const tokenHash = crypto.createHash('sha256').update(dto.refreshTokenRaw).digest('hex');
    
    const token = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    
    if (!token) {
      return left(new Error('REFRESH_TOKEN_INVALID'));
    }

    token.revoke();
    await this.refreshTokenRepository.save(token);

    if (dto.allDevices) {
      const activeTokens = await this.refreshTokenRepository.findActiveByUserId(token.userId);
      for (const activeToken of activeTokens) {
        if (activeToken.id !== token.id) {
          activeToken.revoke();
        }
      }
      if (activeTokens.length > 0) {
        await this.refreshTokenRepository.saveMany(activeTokens);
      }
    }

    return right(undefined);
  }
}
