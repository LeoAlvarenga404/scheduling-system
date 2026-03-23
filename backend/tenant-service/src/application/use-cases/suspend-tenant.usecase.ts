import { Either, left, right } from '../../domain/core/either';
import { UseCase } from '../../domain/core/use-case';
import { ITenantRepository, ITenantSubscriptionRepository } from '../../domain/repositories/tenant-repository.interface';
import { TenantNotFoundError, TenantInvalidStateError } from '../../domain/errors/tenant-operation.errors';
import { DomainEventPublisher } from '../events/domain-event-publisher';
import { publishTenantEvents } from '../events/publish-tenant-events';
import { NoopDomainEventPublisher } from '../events/noop-domain-event-publisher';
import { TenantSubscription } from '../../domain/entities/tenant-subscription';

export interface SuspendTenantRequest {
  tenantId: string;
  reason: string;
}

export type SuspendTenantOutput = Either<
  TenantNotFoundError | TenantInvalidStateError,
  { success: boolean }
>;

export class SuspendTenantUseCase
  implements UseCase<SuspendTenantRequest, SuspendTenantOutput>
{
  constructor(
    private tenantRepository: ITenantRepository,
    private subscriptionRepository: ITenantSubscriptionRepository,
    private eventPublisher: DomainEventPublisher = new NoopDomainEventPublisher(),
  ) {}

  async execute(request: SuspendTenantRequest): Promise<SuspendTenantOutput> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      return left(new TenantNotFoundError('Tenant not found'));
    }

    try {
      tenant.suspend(request.reason);
    } catch (e: any) {
      return left(new TenantInvalidStateError(e.message));
    }

    const activeSubscription = await this.subscriptionRepository.findActiveByTenantId(tenant.id);
    const subscriptionsToUpdate: TenantSubscription[] = [];
    if (activeSubscription) {
      activeSubscription.suspend();
      subscriptionsToUpdate.push(activeSubscription);
    }

    await this.tenantRepository.update(tenant, subscriptionsToUpdate);
    await publishTenantEvents(tenant, this.eventPublisher);

    return right({ success: true });
  }
}
