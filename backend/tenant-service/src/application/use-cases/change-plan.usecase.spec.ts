import { beforeEach, describe, expect, it } from 'vitest';
import { ChangePlanUseCase, ITenantUsageService } from './change-plan.usecase';
import { InMemoryTenantRepository } from '../../test/repositories/in-memory-tenant.repository';
import { InMemorySubscriptionPlanRepository } from '../../test/repositories/in-memory-subscription-plan.repository';
import { InMemoryDomainEventPublisher } from '../../test/publishers/in-memory-domain-event.publisher';
import { Tenant, TenantStatus } from '../../domain/entities/tenant';
import { TenantSubscription, SubscriptionStatus } from '../../domain/entities/tenant-subscription';
import { SubscriptionPlan } from '../../domain/entities/subscription-plan';
import { CNPJ } from '../../domain/value-objects/cnpj';
import { TenantNotFoundError, PlanDowngradeError } from '../../domain/errors/tenant-operation.errors';
import { PlanNotFoundError } from '../../domain/errors/tenant.errors';
import { InMemoryTenantSubscriptionRepository } from 'src/test/repositories/in-memory-tenant-subscription.repository';

class InMemoryTenantUsageService implements ITenantUsageService {
  public usage = {
    appointmentsThisMonth: 0,
    activeProfessionals: 0,
    activeRooms: 0,
  };

  async getCurrentUsage(tenantId: string) {
    return this.usage;
  }
}

let sut: ChangePlanUseCase;
let tenantRepository: InMemoryTenantRepository;
let planRepository: InMemorySubscriptionPlanRepository;
let subscriptionRepository: InMemoryTenantSubscriptionRepository;
let usageService: InMemoryTenantUsageService;
let eventPublisher: InMemoryDomainEventPublisher;

describe('Change Plan Use Case', () => {
  beforeEach(() => {
    tenantRepository = new InMemoryTenantRepository();
    planRepository = new InMemorySubscriptionPlanRepository();
    subscriptionRepository = new InMemoryTenantSubscriptionRepository();
    usageService = new InMemoryTenantUsageService();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new ChangePlanUseCase(tenantRepository, planRepository, subscriptionRepository, usageService, eventPublisher);

    // Setup plans
    planRepository.items.push(
      SubscriptionPlan.create({
        name: 'Free Plan',
        maxAppointmentsPerMonth: 10,
        maxProfessionals: 1,
        maxRooms: 1,
        features: [],
        isActive: true,
      }, 'plan-free'),
      SubscriptionPlan.create({
        name: 'Pro Plan',
        maxAppointmentsPerMonth: 100,
        maxProfessionals: 10,
        maxRooms: 5,
        features: ['advanced-analytics'],
        isActive: true,
      }, 'plan-pro')
    );
  });

  it('should change tenant plan when limits are respected', async () => {
    const tenant = Tenant.restore({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: CNPJ.create('12345678000195'),
      status: TenantStatus.ACTIVE,
      activeSubscriptionId: 'sub-old',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, 'tenant-1');
    
    const oldSubscription = TenantSubscription.create({
      tenantId: 'tenant-1',
      planId: 'plan-pro',
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: null,
      suspendedAt: null,
      cancelledAt: null,
    }, 'sub-old');

    await tenantRepository.save(tenant);
    subscriptionRepository.items.push(oldSubscription);

    const response = await sut.execute({
      tenantId: 'tenant-1',
      newPlanId: 'plan-free',
    });

    expect(response.isRight()).toBe(true);
    expect(tenant.activeSubscriptionId).not.toBe('sub-old');
    expect(oldSubscription.status).toBe(SubscriptionStatus.CANCELLED);
    expect(tenantRepository.subscriptions).toHaveLength(1); // The new one
    expect(eventPublisher.publishedEvents).toHaveLength(1);
  });

  it('should block plan change if current usage exceeds new plan limits', async () => {
    const tenant = Tenant.restore({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: CNPJ.create('12345678000195'),
      status: TenantStatus.ACTIVE,
      activeSubscriptionId: 'sub-old',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, 'tenant-1');
    
    const oldSubscription = TenantSubscription.create({
      tenantId: 'tenant-1',
      planId: 'plan-pro',
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: null,
      suspendedAt: null,
      cancelledAt: null,
    }, 'sub-old');

    await tenantRepository.save(tenant);
    subscriptionRepository.items.push(oldSubscription);

    // Mock high usage
    usageService.usage.appointmentsThisMonth = 20; // Limit for Free Plan is 10

    const response = await sut.execute({
      tenantId: 'tenant-1',
      newPlanId: 'plan-free',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(PlanDowngradeError);
  });

  it('should return error if new plan does not exist', async () => {
    const tenant = Tenant.restore({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: CNPJ.create('12345678000195'),
      status: TenantStatus.ACTIVE,
      activeSubscriptionId: 'sub-old',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, 'tenant-1');
    
    await tenantRepository.save(tenant);

    const response = await sut.execute({
      tenantId: 'tenant-1',
      newPlanId: 'non-existent',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(PlanNotFoundError);
  });
});
