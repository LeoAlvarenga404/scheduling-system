import { describe, it, expect, vi, beforeEach, Mocked } from 'vitest';
import { RegisterUserUseCase } from '../register-user.usecase';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { EmailVerificationTokenRepository } from '../../../domain/repositories/token.repository';
import { UserRole } from '../../../domain/value-objects/user-enums';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let userRepo: Mocked<UserRepository>;
  let tokenRepo: Mocked<EmailVerificationTokenRepository>;

  beforeEach(() => {
    userRepo = {
      findById: vi.fn(),
      findByEmailAndTenant: vi.fn(),
      save: vi.fn(),
    } as unknown as Mocked<UserRepository>;

    tokenRepo = {
      findByTokenHash: vi.fn(),
      save: vi.fn(),
    } as unknown as Mocked<EmailVerificationTokenRepository>;

    useCase = new RegisterUserUseCase(userRepo, tokenRepo);
  });

  it('should register a new user successfully', async () => {
    userRepo.findByEmailAndTenant.mockResolvedValue(null);
    userRepo.save.mockResolvedValue(undefined);
    tokenRepo.save.mockResolvedValue(undefined);

    await useCase.execute({
      tenantId: 'tenant-1',
      email: 'new@example.com',
      passwordRaw: 'P@ssword123',
      role: UserRole.PATIENT,
    });

    expect(userRepo.save).toHaveBeenCalled();
    expect(tokenRepo.save).toHaveBeenCalled();
  });


  it('should throw if user already exists', async () => {
    userRepo.findByEmailAndTenant.mockResolvedValue({ id: 'existing' } as any);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      email: 'existing@example.com',
      passwordRaw: 'P@ssword123',
      role: UserRole.PATIENT,
    });
    
    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(Error);
    expect((result.value as Error).message).toBe('EMAIL_ALREADY_EXISTS');
  });
});
