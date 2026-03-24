import { Injectable, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../domain/repositories/user.repository';
import { EmailVerificationTokenRepository } from '../../domain/repositories/token.repository';
import { DomainEventPublisher } from '../events/domain-event-publisher';
import { User } from '../../domain/entities/user.entity';
import { EmailVerificationToken } from '../../domain/entities/tokens.entity';
import { UserRole, UserStatus } from '../../domain/value-objects/user-enums';
import { Password } from '../../domain/value-objects/password.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { UserRegisteredEvent } from '../../domain/events/domain-events';
import { Either, left, right } from '../../domain/core/either';

export interface RegisterUserDto {
  tenantId: string | null;
  email: string;
  passwordRaw: string;
  role: UserRole;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: EmailVerificationTokenRepository,
  ) {}

  async execute(dto: RegisterUserDto): Promise<Either<Error, void>> {
    let emailVO: Email;
    let passwordVO: Password;
    try {
      emailVO = Email.create(dto.email);
      passwordVO = Password.create(dto.passwordRaw);
    } catch (e: any) {
      return left(e);
    }

    const existingUser = await this.userRepository.findByEmailAndTenant(emailVO.getValue(), dto.tenantId);
    if (existingUser) {
      return left(new Error('EMAIL_ALREADY_EXISTS'));
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(passwordVO.getValue(), saltRounds);

    const userId = crypto.randomUUID();
    const user = new User(
      userId,
      dto.tenantId,
      emailVO.getValue(),
      passwordHash,
      dto.role,
      UserStatus.PENDING_VERIFICATION,
      0,
      null,
      null,
      new Date(),
      new Date(),
    );

    const tokenId = crypto.randomUUID();
    const tokenRaw = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(tokenRaw).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const verificationToken = new EmailVerificationToken(
      tokenId,
      userId,
      tokenHash,
      expiresAt,
      null,
    );

    // Publish event via Outbox
    const event = new UserRegisteredEvent(
      crypto.randomUUID(),
      crypto.randomUUID(),
      dto.tenantId,
      userId,
      user.email,
      user.role,
      tokenRaw,
    );

    // Persist
    await this.userRepository.save(user, [event]);
    await this.tokenRepository.save(verificationToken);

    return right(undefined);
  }
}
