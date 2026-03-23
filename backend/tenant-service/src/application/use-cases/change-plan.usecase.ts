import { Either, left, right } from '../../domain/core/either';
import { UseCase } from '../../domain/core/use-case';
import { ITenantRepository, ISubscriptionPlanRepository, ITenantSubscriptionRepository } from '../../domain/repositories/tenant-repository.interface';
import { TenantNotFoundError, TenantInvalidStateError, PlanDowngradeError } from '../../domain/errors/tenant-operation.errors';
import { PlanNotFoundError } from '../../domain/errors/tenant.errors';
import { DomainEventPublisher } from '../events/domain-event-publisher';
import { publishTenantEvents } from '../events/publish-tenant-events';
import { NoopDomainEventPublisher } from '../events/noop-domain-event-publisher';
import { TenantSubscription, SubscriptionStatus } from '../../domain/entities/tenant-subscription';

export interface ITenantUsageService {
  getCurrentUsage(tenantId: string): Promise<{
    appointmentsThisMonth: number;
    activeProfessionals: number;
    activeRooms: number;
  }>;
}

export interface ChangePlanRequest {
  tenantId: string;
  newPlanId: string;
}

export type ChangePlanOutput = Either<
  TenantNotFoundError | TenantInvalidStateError | PlanNotFoundError | PlanDowngradeError,
  { success: boolean }
>;

export class ChangePlanUseCase
  implements UseCase<ChangePlanRequest, ChangePlanOutput>
{
  constructor(
    private tenantRepository: ITenantRepository,
    private planRepository: ISubscriptionPlanRepository,
    private subscriptionRepository: ITenantSubscriptionRepository,
    private usageService: ITenantUsageService,
    private eventPublisher: DomainEventPublisher = new NoopDomainEventPublisher(),
  ) {}

  async execute(request: ChangePlanRequest): Promise<ChangePlanOutput> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      return left(new TenantNotFoundError('Tenant not found'));
    }

    const newPlan = await this.planRepository.findById(request.newPlanId);
    if (!newPlan || !newPlan.isActive) {
      return left(new PlanNotFoundError('Active substitution plan not found'));
    }

    // Verify usage doesn't exceed downgrade
    const limits = newPlan.getLimits();
    const usage = await this.usageService.getCurrentUsage(tenant.id);
    
    if (limits.exceedsAppointments(usage.appointmentsThisMonth)) {
      return left(new PlanDowngradeError(`Plan downgrade failed: limit of ${limits.maxAppointmentsPerMonth} appointments exceeded.`));
    }
    if (limits.exceedsProfessionals(usage.activeProfessionals)) {
      return left(new PlanDowngradeError(`Plan downgrade failed: limit of ${limits.maxProfessionals} professionals exceeded.`));
    }
    if (limits.exceedsRooms(usage.activeRooms)) {
      return left(new PlanDowngradeError(`Plan downgrade failed: limit of ${limits.maxRooms} rooms exceeded.`));
    }

    const currentSubscription = await this.subscriptionRepository.findById(tenant.activeSubscriptionId!);
    if (!currentSubscription) {
      return left(new TenantInvalidStateError('Current subscription not found'));
    }

    const currentPlan = await this.planRepository.findById(currentSubscription.planId);
    const previousPlanName = currentPlan ? currentPlan.name : 'Unknown';

    currentSubscription.cancel();

    const newSubscriptionId = crypto.randomUUID();
    const newSubscription = TenantSubscription.create({
      tenantId: tenant.id,
      planId: newPlan.id,
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: null,
      suspendedAt: null,
      cancelledAt: null
    }, newSubscriptionId);

    try {
      tenant.changePlan(newSubscriptionId, previousPlanName, newPlan.name, limits);
    } catch (e: any) {
      return left(new TenantInvalidStateError(e.message));
    }

    await this.tenantRepository.save(tenant, newSubscription, currentSubscription);
    await publishTenantEvents(tenant, this.eventPublisher);

    return right({ success: true });
  }
}
