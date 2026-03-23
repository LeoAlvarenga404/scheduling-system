import { Controller, Get, Param, ParseUUIDPipe, HttpException, HttpStatus, UseInterceptors } from '@nestjs/common';
import { GetTenantLimitsUseCase } from '../../../application/use-cases/get-tenant-limits.usecase';
import { GetTenantUsageUseCase } from '../../../application/use-cases/get-tenant-usage.usecase';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';

@Controller('internal/tenants')
export class InternalTenantsController {
  constructor(
    private readonly getTenantLimitsUseCase: GetTenantLimitsUseCase,
    private readonly getTenantUsageUseCase: GetTenantUsageUseCase,
  ) {}

  @Get(':id/limits')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300) // 5 minutes cache as per PRD "Usa Redis para cache"
  async getTenantLimits(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.getTenantLimitsUseCase.execute({ tenantId: id });
    if (result.isLeft()) {
      throw new HttpException(result.value.message, HttpStatus.NOT_FOUND);
    }
    return result.value;
  }

  @Get(':id/usage')
  async getTenantUsage(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.getTenantUsageUseCase.execute({ tenantId: id });
    if (result.isLeft()) {
      throw new HttpException(result.value.message, HttpStatus.NOT_FOUND);
    }
    return result.value;
  }
}
