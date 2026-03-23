import { IsString, IsEmail, IsNotEmpty, IsUUID, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  slug: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{14}$/, { message: 'Document must be a 14-digit CNPJ' })
  document: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsUUID()
  @IsNotEmpty()
  planId: string;
}

export class SuspendTenantDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ChangePlanDto {
  @IsUUID()
  @IsNotEmpty()
  newPlanId: string;
}
