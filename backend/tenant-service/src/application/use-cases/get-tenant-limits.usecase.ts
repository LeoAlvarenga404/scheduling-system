import { Either, left, right } from '../../domain/core/either';
import { UseCase } from '../../domain/core/use-case';
import { ITenantRepository, ISubscriptionPlanRepository, ITenantSubscriptionRepository } from '../../domain/repositories/tenant-repository.interface';
import { TenantNotFoundError } from '../../domain/errors/tenant-operation.errors';

export interface GetTenantLimitsRequest {
  tenantId: string;
}

export type GetTenantLimitsOutput = Either<
  TenantNotFoundError,
  {
    tenantId: string;
    status: string;
    plan: string;
    limits: {
      maxAppointmentsPerMonth: number | null;
      maxProfessionals: number | null;
      maxRooms: number | null;
    };
    features: string[];
  }
>;

export class GetTenantLimitsUseCase
  implements UseCase<GetTenantLimitsRequest, GetTenantLimitsOutput>
{
  constructor(
    private tenantRepository: ITenantRepository,
    private planRepository: ISubscriptionPlanRepository,
    private subscriptionRepository: ITenantSubscriptionRepository,
  ) {}

  async execute(request: GetTenantLimitsRequest): Promise<GetTenantLimitsOutput> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      return left(new TenantNotFoundError('Tenant not found'));
    }

    let planName = 'Unknown';
    let limits: {
      maxAppointmentsPerMonth: number | null;
      maxProfessionals: number | null;
      maxRooms: number | null;
    } = {
      maxAppointmentsPerMonth: null,
      maxProfessionals: null,
      maxRooms: null,
    };
    let features: string[] = [];

    if (tenant.activeSubscriptionId) {
      const activeSubscription = await this.subscriptionRepository.findById(tenant.activeSubscriptionId);
      if (activeSubscription) {
        const plan = await this.planRepository.findById(activeSubscription.planId);
        if (plan) {
          planName = plan.name;
          const planLimits = plan.getLimits();
          limits = {
            maxAppointmentsPerMonth: planLimits.maxAppointmentsPerMonth,
            maxProfessionals: planLimits.maxProfessionals,
            maxRooms: planLimits.maxRooms,
          };
          features = planLimits.features;
        }
      }
    }

    return right({
      tenantId: tenant.id,
      status: tenant.status,
      plan: planName,
      limits,
      features
    });
  }
}
