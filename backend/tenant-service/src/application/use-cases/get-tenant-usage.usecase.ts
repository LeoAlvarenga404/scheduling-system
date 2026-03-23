import { Either, left, right } from '../../domain/core/either';
import { UseCase } from '../../domain/core/use-case';
import { ITenantUsageService } from './change-plan.usecase';
import { ITenantRepository } from '../../domain/repositories/tenant-repository.interface';
import { TenantNotFoundError } from '../../domain/errors/tenant-operation.errors';

export interface GetTenantUsageRequest {
  tenantId: string;
}

export type GetTenantUsageOutput = Either<
  TenantNotFoundError,
  {
    appointmentsThisMonth: number;
    activeProfessionals: number;
    activeRooms: number;
  }
>;

export class GetTenantUsageUseCase
  implements UseCase<GetTenantUsageRequest, GetTenantUsageOutput>
{
  constructor(
    private tenantRepository: ITenantRepository,
    private usageService: ITenantUsageService,
  ) {}

  async execute(request: GetTenantUsageRequest): Promise<GetTenantUsageOutput> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      return left(new TenantNotFoundError('Tenant not found'));
    }

    const usage = await this.usageService.getCurrentUsage(tenant.id);

    return right(usage);
  }
}
