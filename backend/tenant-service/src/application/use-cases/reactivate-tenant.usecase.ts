import { Either, left, right } from '../../domain/core/either';
import { UseCase } from '../../domain/core/use-case';
import { ITenantRepository, ITenantSubscriptionRepository } from '../../domain/repositories/tenant-repository.interface';
import { TenantNotFoundError, TenantInvalidStateError } from '../../domain/errors/tenant-operation.errors';
import { DomainEventPublisher } from '../events/domain-event-publisher';
import { publishTenantEvents } from '../events/publish-tenant-events';
import { NoopDomainEventPublisher } from '../events/noop-domain-event-publisher';
import { SubscriptionStatus, TenantSubscription } from '../../domain/entities/tenant-subscription';

export interface ReactivateTenantRequest {
  tenantId: string;
}

export type ReactivateTenantOutput = Either<
  TenantNotFoundError | TenantInvalidStateError,
  { success: boolean }
>;

export class ReactivateTenantUseCase
  implements UseCase<ReactivateTenantRequest, ReactivateTenantOutput>
{
  constructor(
    private tenantRepository: ITenantRepository,
    private subscriptionRepository: ITenantSubscriptionRepository,
    private eventPublisher: DomainEventPublisher = new NoopDomainEventPublisher(),
  ) {}

  async execute(request: ReactivateTenantRequest): Promise<ReactivateTenantOutput> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      return left(new TenantNotFoundError('Tenant not found'));
    }

    try {
      tenant.reactivate();
    } catch (e: any) {
      return left(new TenantInvalidStateError(e.message));
    }

    const subscription = await this.subscriptionRepository.findById(tenant.activeSubscriptionId!);
    const subscriptionsToUpdate: TenantSubscription[] = [];
    if (subscription && subscription.status === SubscriptionStatus.SUSPENDED) {
      subscription.reactivate();
      subscriptionsToUpdate.push(subscription);
    }

    await this.tenantRepository.update(tenant, subscriptionsToUpdate);
    await publishTenantEvents(tenant, this.eventPublisher);

    return right({ success: true });
  }
}
