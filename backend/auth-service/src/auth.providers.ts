import { Provider } from '@nestjs/common';
import { RegisterUserUseCase } from './application/use-cases/register-user.usecase';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.usecase';
import { LoginUseCase } from './application/use-cases/login.usecase';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from './application/use-cases/logout.usecase';
import { RequestPasswordResetUseCase } from './application/use-cases/request-password-reset.usecase';
import { ConfirmPasswordResetUseCase } from './application/use-cases/confirm-password-reset.usecase';
import { ChangeUserRoleUseCase } from './application/use-cases/change-user-role.usecase';
import { DeactivateUserUseCase } from './application/use-cases/deactivate-user.usecase';

import { UserRepository } from './domain/repositories/user.repository';
import { RefreshTokenRepository, PasswordResetTokenRepository, EmailVerificationTokenRepository } from './domain/repositories/token.repository';
import { DomainEventPublisher } from './application/events/domain-event-publisher';
import { PrismaUserRepository } from './infrastructure/database/prisma/repositories/prisma-user.repository';
import { 
  PrismaRefreshTokenRepository, 
  PrismaPasswordResetTokenRepository, 
  PrismaEmailVerificationTokenRepository 
} from './infrastructure/database/prisma/repositories/prisma-token.repository';
import { RabbitMQDomainEventPublisher } from './infrastructure/messaging/rabbitmq-domain-event.publisher';
import { JwtService } from '@nestjs/jwt';

export const authProviders: Provider[] = [
  // Repositories
  PrismaUserRepository,
  {
    provide: UserRepository,
    useExisting: PrismaUserRepository,
  },
  PrismaRefreshTokenRepository,
  {
    provide: RefreshTokenRepository,
    useExisting: PrismaRefreshTokenRepository,
  },
  PrismaPasswordResetTokenRepository,
  {
    provide: PasswordResetTokenRepository,
    useExisting: PrismaPasswordResetTokenRepository,
  },
  PrismaEmailVerificationTokenRepository,
  {
    provide: EmailVerificationTokenRepository,
    useExisting: PrismaEmailVerificationTokenRepository,
  },

  // Publisher
  RabbitMQDomainEventPublisher,
  {
    provide: DomainEventPublisher,
    useExisting: RabbitMQDomainEventPublisher,
  },

  // Use Cases
  {
    provide: RegisterUserUseCase,
    useFactory: (repo: UserRepository, tokenRepo: EmailVerificationTokenRepository) =>
      new RegisterUserUseCase(repo, tokenRepo),
    inject: [UserRepository, EmailVerificationTokenRepository],
  },
  {
    provide: VerifyEmailUseCase,
    useFactory: (repo: UserRepository, tokenRepo: EmailVerificationTokenRepository) =>
      new VerifyEmailUseCase(repo, tokenRepo),
    inject: [UserRepository, EmailVerificationTokenRepository],
  },
  {
    provide: LoginUseCase,
    useFactory: (repo: UserRepository, tokenRepo: RefreshTokenRepository, jwt: JwtService) =>
      new LoginUseCase(repo, tokenRepo, jwt),
    inject: [UserRepository, RefreshTokenRepository, JwtService],
  },
  {
    provide: RefreshTokenUseCase,
    useFactory: (rtRepo: RefreshTokenRepository, userRepo: UserRepository, jwt: JwtService) =>
      new RefreshTokenUseCase(rtRepo, userRepo, jwt),
    inject: [RefreshTokenRepository, UserRepository, JwtService],
  },
  {
    provide: LogoutUseCase,
    useFactory: (rtRepo: RefreshTokenRepository) => new LogoutUseCase(rtRepo),
    inject: [RefreshTokenRepository],
  },
  {
    provide: RequestPasswordResetUseCase,
    useFactory: (userRepo: UserRepository, resetRepo: PasswordResetTokenRepository) =>
      new RequestPasswordResetUseCase(userRepo, resetRepo),
    inject: [UserRepository, PasswordResetTokenRepository],
  },
  {
    provide: ConfirmPasswordResetUseCase,
    useFactory: (userRepo: UserRepository, resetRepo: PasswordResetTokenRepository, rtRepo: RefreshTokenRepository) =>
      new ConfirmPasswordResetUseCase(userRepo, resetRepo, rtRepo),
    inject: [UserRepository, PasswordResetTokenRepository, RefreshTokenRepository],
  },
  {
    provide: ChangeUserRoleUseCase,
    useFactory: (userRepo: UserRepository, rtRepo: RefreshTokenRepository) =>
      new ChangeUserRoleUseCase(userRepo, rtRepo),
    inject: [UserRepository, RefreshTokenRepository],
  },
  {
    provide: DeactivateUserUseCase,
    useFactory: (userRepo: UserRepository, rtRepo: RefreshTokenRepository) =>
      new DeactivateUserUseCase(userRepo, rtRepo),
    inject: [UserRepository, RefreshTokenRepository],
  },
];
