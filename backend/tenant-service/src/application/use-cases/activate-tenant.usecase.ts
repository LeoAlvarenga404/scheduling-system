import { Either, left, right } from '../../domain/core/either';
import { UseCase } from '../../domain/core/use-case';
import { ITenantRepository } from '../../domain/repositories/tenant-repository.interface';
import { TenantNotFoundError, TenantInvalidStateError } from '../../domain/errors/tenant-operation.errors';
import { DomainEventPublisher } from '../events/domain-event-publisher';
import { publishTenantEvents } from '../events/publish-tenant-events';
import { NoopDomainEventPublisher } from '../events/noop-domain-event-publisher';

export interface ActivateTenantRequest {
  tenantId: string;
}

export type ActivateTenantOutput = Either<
  TenantNotFoundError | TenantInvalidStateError,
  { success: boolean }
>;

export class ActivateTenantUseCase
  implements UseCase<ActivateTenantRequest, ActivateTenantOutput>
{
  constructor(
    private tenantRepository: ITenantRepository,
    private eventPublisher: DomainEventPublisher = new NoopDomainEventPublisher(),
  ) {}

  async execute(request: ActivateTenantRequest): Promise<ActivateTenantOutput> {
    const tenant = await this.tenantRepository.findById(request.tenantId);
    if (!tenant) {
      return left(new TenantNotFoundError('Tenant not found'));
    }

    try {
      tenant.activate();
    } catch (e: any) {
      return left(new TenantInvalidStateError(e.message));
    }

    await this.tenantRepository.update(tenant);
    await publishTenantEvents(tenant, this.eventPublisher);

    return right({ success: true });
  }
}
