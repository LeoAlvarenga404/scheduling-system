import { Either, left, right } from '../../domain/core/either';
import { UseCase } from '../../domain/core/use-case';
import { ITenantRepository, ITenantSubscriptionRepository } from '../../domain/repositories/tenant-repository.interface';
import { TenantNotFoundError, TenantInvalidStateError } from '../../domain/errors/tenant-operation.errors';
import { DomainEventPublisher } from '../events/domain-event-publisher';
import { publishTenantEvents } from '../events/publish-tenant-events';
import { NoopDomainEventPublisher } from '../events/noop-domain-event-publisher';
import { TenantSubscription } from '../../domain/entities/tenant-subscription';

export interface CancelTenantRequest {
  tenantId: string;
}

export type CancelTenantOutput = Either<
  TenantNotFoundError | TenantInvalidStateError,
  { success: boolean }
>;

export class CancelTenantUseCase
  implements UseCase<CancelTenantRequest, CancelTenantOutput>
{
  constructor(
    private tenantRepository: ITenantRepository,
    private subscriptionRepository: ITenantSubscriptionRepository,
    private eventPublisher: DomainEventPublisher = new NoopDomainEventPublisher(),
  ) {}

  async execute(request: CancelTenantRequest): Promise<CancelTenantOutput> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      return left(new TenantNotFoundError('Tenant not found'));
    }

    try {
      tenant.cancel();
    } catch (e: any) {
      return left(new TenantInvalidStateError(e.message));
    }

    const subscription = await this.subscriptionRepository.findById(tenant.activeSubscriptionId!);
    const subscriptionsToUpdate: TenantSubscription[] = [];
    if (subscription) {
      subscription.cancel();
      subscriptionsToUpdate.push(subscription);
    }

    await this.tenantRepository.update(tenant, subscriptionsToUpdate);
    await publishTenantEvents(tenant, this.eventPublisher);

    return right({ success: true });
  }
}
