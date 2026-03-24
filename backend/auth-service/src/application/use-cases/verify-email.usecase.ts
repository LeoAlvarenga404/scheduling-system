import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { UserRepository } from '../../domain/repositories/user.repository';
import { EmailVerificationTokenRepository } from '../../domain/repositories/token.repository';
import { DomainEventPublisher } from '../events/domain-event-publisher';
import { UserVerifiedEvent } from '../../domain/events/domain-events';
import { Either, left, right } from '../../domain/core/either';

export interface VerifyEmailDto {
  tokenRaw: string;
}

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: EmailVerificationTokenRepository,
  ) {}

  async execute(dto: VerifyEmailDto): Promise<Either<Error, void>> {
    const tokenHash = crypto.createHash('sha256').update(dto.tokenRaw).digest('hex');
    
    const token = await this.tokenRepository.findByTokenHash(tokenHash);
    if (!token || !token.isValid()) {
      return left(new Error('INVALID_OR_EXPIRED_TOKEN'));
    }

    const user = await this.userRepository.findById(token.userId);
    if (!user) {
      return left(new Error('USER_NOT_FOUND'));
    }

    token.markAsUsed();
    user.verifyEmail();

    const event = new UserVerifiedEvent(
      crypto.randomUUID(),
      crypto.randomUUID(),
      user.tenantId,
      user.id,
      user.email,
    );

    await this.tokenRepository.save(token);
    await this.userRepository.save(user, [event]);

    return right(undefined);
  }
}
