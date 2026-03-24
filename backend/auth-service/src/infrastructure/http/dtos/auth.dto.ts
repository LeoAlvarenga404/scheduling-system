import { IsEmail, IsString, IsNotEmpty, IsOptional, IsUUID, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '../../../domain/value-objects/user-enums';

export class RegisterUserRequestDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class VerifyEmailRequestDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

export class LoginRequestDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenRequestDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class LogoutRequestDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;

  @IsOptional()
  @IsBoolean()
  allDevices?: boolean;
}

export class RequestPasswordResetRequestDto {
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @IsEmail()
  email!: string;
}

export class ConfirmPasswordResetRequestDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class ChangeUserRoleRequestDto {
  @IsString()
  @IsNotEmpty()
  adminId!: string;

  @IsEnum(UserRole)
  adminRole!: UserRole;

  @IsOptional()
  @IsUUID()
  adminTenantId?: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

export class DeactivateUserRequestDto {
  @IsString()
  @IsNotEmpty()
  adminId!: string;

  @IsEnum(UserRole)
  adminRole!: UserRole;

  @IsOptional()
  @IsUUID()
  adminTenantId?: string;
}
