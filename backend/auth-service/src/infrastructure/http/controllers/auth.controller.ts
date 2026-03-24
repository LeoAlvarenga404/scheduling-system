import { Controller, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseGuards, Req, UnauthorizedException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Either } from '../../../domain/core/either';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.usecase';
import { VerifyEmailUseCase } from '../../../application/use-cases/verify-email.usecase';
import { LoginUseCase } from '../../../application/use-cases/login.usecase';
import { RefreshTokenUseCase } from '../../../application/use-cases/refresh-token.usecase';
import { LogoutUseCase } from '../../../application/use-cases/logout.usecase';
import { RequestPasswordResetUseCase } from '../../../application/use-cases/request-password-reset.usecase';
import { ConfirmPasswordResetUseCase } from '../../../application/use-cases/confirm-password-reset.usecase';
import { ChangeUserRoleUseCase } from '../../../application/use-cases/change-user-role.usecase';
import { DeactivateUserUseCase } from '../../../application/use-cases/deactivate-user.usecase';
import { UserRole } from '../../../domain/value-objects/user-enums';
import { RegisterUserRequestDto, VerifyEmailRequestDto, LoginRequestDto, RefreshTokenRequestDto, LogoutRequestDto, RequestPasswordResetRequestDto, ConfirmPasswordResetRequestDto, ChangeUserRoleRequestDto, DeactivateUserRequestDto } from '../dtos/auth.dto';

@Controller()
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly verifyEmail: VerifyEmailUseCase,
    private readonly login: LoginUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly requestPasswordReset: RequestPasswordResetUseCase,
    private readonly confirmPasswordReset: ConfirmPasswordResetUseCase,
    private readonly changeUserRole: ChangeUserRoleUseCase,
    private readonly deactivateUser: DeactivateUserUseCase,
  ) {}

  private handleEither<T>(result: Either<Error, T>): T {
    if (result.isLeft()) {
      const error = result.value;
      if (['INVALID_CREDENTIALS', 'EMAIL_NOT_VERIFIED', 'ACCOUNT_LOCKED', 'INVALID_OR_EXPIRED_TOKEN', 'USER_NOT_FOUND', 'REFRESH_TOKEN_INVALID'].includes(error.message)) {
        throw new UnauthorizedException(error.message);
      }
      if (['EMAIL_ALREADY_EXISTS'].includes(error.message)) {
        throw new ConflictException(error.message);
      }
      if (['FORBIDDEN_CROSS_TENANT_ACTION', 'MANAGER_CANNOT_PROMOT_TO_ADMIN', 'CANNOT_CHANGE_OWN_ROLE', 'CANNOT_DEACTIVATE_OWN_ACCOUNT'].includes(error.message)) {
        throw new ForbiddenException(error.message);
      }
      throw new BadRequestException(error.message);
    }
    return result.value as T;
  }

  @Post('register')
  async register(@Body() body: RegisterUserRequestDto) {
    const result = await this.registerUser.execute({
      tenantId: body.tenantId || null,
      email: body.email,
      passwordRaw: body.password,
      role: body.role ?? UserRole.PATIENT,
    });
    return this.handleEither(result);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() body: VerifyEmailRequestDto) {
    const result = await this.verifyEmail.execute({ tokenRaw: body.token });
    return this.handleEither(result);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async loginEndpoint(@Body() body: LoginRequestDto) {
    const result = await this.login.execute({
      tenantId: body.tenantId || null,
      email: body.email,
      passwordRaw: body.password,
    });
    return this.handleEither(result);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenRequestDto) {
    const result = await this.refreshToken.execute({ refreshTokenRaw: body.refreshToken });
    return this.handleEither(result);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: LogoutRequestDto) {
    const result = await this.logoutUseCase.execute({ 
      refreshTokenRaw: body.refreshToken,
      allDevices: body.allDevices,
    });
    return this.handleEither(result);
  }

  @Post('password/reset-request')
  @HttpCode(HttpStatus.OK)
  async resetRequest(@Body() body: RequestPasswordResetRequestDto) {
    const result = await this.requestPasswordReset.execute({
      tenantId: body.tenantId || null,
      email: body.email,
    });
    return this.handleEither(result);
  }

  @Post('password/reset-confirm')
  @HttpCode(HttpStatus.OK)
  async resetConfirm(@Body() body: ConfirmPasswordResetRequestDto) {
    const result = await this.confirmPasswordReset.execute({
      tokenRaw: body.token,
      newPasswordRaw: body.password,
    });
    return this.handleEither(result);
  }

  @Patch('users/:id/role')
  async changeRole(@Param('id') id: string, @Body() body: ChangeUserRoleRequestDto, @Req() req: any) {
    // Note: In a real scenario, adminId/Role/Tenant should come from JWT via a Guard
    const result = await this.changeUserRole.execute({
      adminId: body.adminId, // Placeholder
      adminRole: body.adminRole,
      adminTenantId: body.adminTenantId || null,
      targetUserId: id,
      newRole: body.role,
    });
    return this.handleEither(result);
  }

  @Delete('users/:id')
  async deactivate(@Param('id') id: string, @Body() body: DeactivateUserRequestDto) {
    const result = await this.deactivateUser.execute({
      adminId: body.adminId,
      adminRole: body.adminRole,
      adminTenantId: body.adminTenantId || null,
      targetUserId: id,
    });
    return this.handleEither(result);
  }
}
