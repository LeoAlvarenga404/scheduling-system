import { Controller, Post, Body, Param, HttpCode, HttpStatus, ParseUUIDPipe, Get, UseGuards, HttpException } from '@nestjs/common';
import { CreateTenantUseCase } from '../../../application/use-cases/create-tenant.usecase';
import { SuspendTenantUseCase } from '../../../application/use-cases/suspend-tenant.usecase';
import { ReactivateTenantUseCase } from '../../../application/use-cases/reactivate-tenant.usecase';
import { CancelTenantUseCase } from '../../../application/use-cases/cancel-tenant.usecase';
import { ChangePlanUseCase } from '../../../application/use-cases/change-plan.usecase';
import { CreateTenantDto, SuspendTenantDto, ChangePlanDto } from '../dtos/tenant.dto';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantsController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly suspendTenantUseCase: SuspendTenantUseCase,
    private readonly reactivateTenantUseCase: ReactivateTenantUseCase,
    private readonly cancelTenantUseCase: CancelTenantUseCase,
    private readonly changePlanUseCase: ChangePlanUseCase,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async createTenant(@Body() dto: CreateTenantDto) {
    const result = await this.createTenantUseCase.execute(dto);
    if (result.isLeft()) {
      throw new HttpException(result.value.message, HttpStatus.BAD_REQUEST);
    }
    return result.value;
  }

  @Post(':id/suspend')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async suspendTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendTenantDto,
  ) {
    const result = await this.suspendTenantUseCase.execute({ tenantId: id, reason: dto.reason });
    if (result.isLeft()) {
      throw new HttpException(result.value.message, HttpStatus.UNPROCESSABLE_ENTITY); // Or Bad Request
    }
    return result.value;
  }

  @Post(':id/reactivate')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async reactivateTenant(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.reactivateTenantUseCase.execute({ tenantId: id });
    if (result.isLeft()) {
      throw new HttpException(result.value.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return result.value;
  }

  @Post(':id/cancel')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async cancelTenant(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.cancelTenantUseCase.execute({ tenantId: id });
    if (result.isLeft()) {
      throw new HttpException(result.value.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return result.value;
  }

  @Post(':id/plan')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async changePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePlanDto,
  ) {
    const result = await this.changePlanUseCase.execute({ tenantId: id, newPlanId: dto.newPlanId });
    if (result.isLeft()) {
      throw new HttpException(result.value.message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return result.value;
  }
}
