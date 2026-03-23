import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantLimitsUseCase } from './get-tenant-limits.usecase';
import { InMemoryTenantRepository } from '../../test/repositories/in-memory-tenant.repository';
import { InMemorySubscriptionPlanRepository } from '../../test/repositories/in-memory-subscription-plan.repository';
import { Tenant, TenantStatus } from '../../domain/entities/tenant';
import { TenantSubscription, SubscriptionStatus } from '../../domain/entities/tenant-subscription';
import { SubscriptionPlan } from '../../domain/entities/subscription-plan';
import { CNPJ } from '../../domain/value-objects/cnpj';
import { TenantNotFoundError } from '../../domain/errors/tenant-operation.errors';
import { InMemoryTenantSubscriptionRepository } from 'src/test/repositories/in-memory-tenant-subscription.repository';

let sut: GetTenantLimitsUseCase;
let tenantRepository: InMemoryTenantRepository;
let planRepository: InMemorySubscriptionPlanRepository;
let subscriptionRepository: InMemoryTenantSubscriptionRepository;

describe('Get Tenant Limits Use Case', () => {
  beforeEach(() => {
    tenantRepository = new InMemoryTenantRepository();
    planRepository = new InMemorySubscriptionPlanRepository();
    subscriptionRepository = new InMemoryTenantSubscriptionRepository();
    sut = new GetTenantLimitsUseCase(tenantRepository, planRepository, subscriptionRepository);

    // Setup plan
    planRepository.items.push(
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

  it('should return tenant limits for a tenant with an active subscription', async () => {
    const tenant = Tenant.restore({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: CNPJ.create('12345678000195'),
      status: TenantStatus.ACTIVE,
      activeSubscriptionId: 'sub-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, 'tenant-1');
    
    const subscription = TenantSubscription.create({
      tenantId: 'tenant-1',
      planId: 'plan-pro',
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
      expiresAt: null,
      suspendedAt: null,
      cancelledAt: null,
    }, 'sub-1');

    await tenantRepository.save(tenant);
    subscriptionRepository.items.push(subscription);

    const response = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(response.isRight()).toBe(true);
    if (response.isRight()) {
      expect(response.value.plan).toBe('Pro Plan');
      expect(response.value.limits.maxAppointmentsPerMonth).toBe(100);
      expect(response.value.features).toContain('advanced-analytics');
    }
  });

  it('should return unknown plan and null limits if tenant has no active subscription', async () => {
    const tenant = Tenant.restore({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: CNPJ.create('12345678000195'),
      status: TenantStatus.PENDING_SETUP,
      activeSubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, 'tenant-1');
    
    await tenantRepository.save(tenant);

    const response = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(response.isRight()).toBe(true);
    if (response.isRight()) {
      expect(response.value.plan).toBe('Unknown');
      expect(response.value.limits.maxAppointmentsPerMonth).toBeNull();
    }
  });

  it('should return error for non-existent tenant', async () => {
    const response = await sut.execute({
      tenantId: 'non-existent',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(TenantNotFoundError);
  });
});
