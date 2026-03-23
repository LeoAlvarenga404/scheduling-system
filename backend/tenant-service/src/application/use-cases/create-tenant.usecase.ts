import { Either, left, right } from '../../domain/core/either';
import { UseCase } from '../../domain/core/use-case';
import { Tenant } from '../../domain/entities/tenant';
import { TenantSubscription } from '../../domain/entities/tenant-subscription';
import { SubscriptionStatus } from '../../domain/entities/tenant-subscription';
import { CNPJ } from '../../domain/value-objects/cnpj';
import {
  TenantValidationError,
  TenantAlreadyExistsError,
  PlanNotFoundError,
} from '../../domain/errors/tenant.errors';
import {
  ITenantRepository,
  ISubscriptionPlanRepository,
} from '../../domain/repositories/tenant-repository.interface';
import { DomainEventPublisher } from '../events/domain-event-publisher';
import { NoopDomainEventPublisher } from '../events/noop-domain-event-publisher';
import { publishTenantEvents } from '../events/publish-tenant-events';

export interface CreateTenantRequest {
  name: string;
  slug: string;
  email: string;
  phone: string;
  document: string;
  planId: string;
}

export type CreateTenantOutput = Either<
  TenantValidationError | TenantAlreadyExistsError | PlanNotFoundError,
  { tenant: Tenant }
>;

export class CreateTenantUseCase
  implements UseCase<CreateTenantRequest, CreateTenantOutput>
{
  constructor(
    private tenantRepository: ITenantRepository,
    private planRepository: ISubscriptionPlanRepository,
    private readonly eventPublisher: DomainEventPublisher = new NoopDomainEventPublisher(),
  ) {}

  async execute(request: CreateTenantRequest): Promise<CreateTenantOutput> {
    let documentResult: CNPJ;
    try {
      documentResult = CNPJ.create(request.document);
    } catch {
      return left(new TenantValidationError('Invalid CNPJ'));
    }
    
    // Check if tenant exist
    const existingByDoc = await this.tenantRepository.findByDocument(documentResult.getValue());
    if (existingByDoc) {
      return left(new TenantAlreadyExistsError('A tenant with this document already exists'));
    }

    const existingBySlug = await this.tenantRepository.findBySlug(request.slug);
    if (existingBySlug) {
      return left(new TenantAlreadyExistsError('A tenant with this slug already exists'));
    }

    // Check Plan
    const plan = await this.planRepository.findById(request.planId);
    if (!plan || !plan.isActive) {
      return left(new PlanNotFoundError('Active subscription plan not found'));
    }

    // Prepare creation
    const subscriptionId = crypto.randomUUID();
    const tenant = Tenant.create({
      name: request.name,
      slug: request.slug,
      email: request.email,
      phone: request.phone,
      document: documentResult,
    });

    const subscription = TenantSubscription.create({
      tenantId: tenant.id,
      planId: plan.id,
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: null,
      suspendedAt: null,
      cancelledAt: null
    }, subscriptionId);

    // Save
    await this.tenantRepository.save(tenant, subscription);

    // Publish
    await publishTenantEvents(tenant, this.eventPublisher);

    return right({ tenant });
  }
}
