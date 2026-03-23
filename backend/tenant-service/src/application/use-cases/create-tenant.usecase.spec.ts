import { beforeEach, describe, expect, it } from 'vitest';
import { CreateTenantUseCase } from './create-tenant.usecase';
import { InMemoryTenantRepository } from '../../test/repositories/in-memory-tenant.repository';
import { InMemorySubscriptionPlanRepository } from '../../test/repositories/in-memory-subscription-plan.repository';
import { InMemoryDomainEventPublisher } from '../../test/publishers/in-memory-domain-event.publisher';
import { SubscriptionPlan } from '../../domain/entities/subscription-plan';
import { TenantAlreadyExistsError, PlanNotFoundError, TenantValidationError } from '../../domain/errors/tenant.errors';

let sut: CreateTenantUseCase;
let tenantRepository: InMemoryTenantRepository;
let planRepository: InMemorySubscriptionPlanRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe('Create Tenant Use Case', () => {
  beforeEach(() => {
    tenantRepository = new InMemoryTenantRepository();
    planRepository = new InMemorySubscriptionPlanRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new CreateTenantUseCase(tenantRepository, planRepository, eventPublisher);

    // Initial data
    planRepository.items.push(SubscriptionPlan.create({
      name: 'Free Plan',
      maxAppointmentsPerMonth: 10,
      maxProfessionals: 1,
      maxRooms: 1,
      features: [],
      isActive: true,
    }, 'plan-free'));
  });

  it('should create a new tenant with an active subscription', async () => {
    const response = await sut.execute({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: '12345678000195', // Valid CNPJ
      planId: 'plan-free',
    });

    expect(response.isRight()).toBe(true);

    if (response.isRight()) {
      expect(response.value.tenant.name).toBe('Test Tenant');
      expect(response.value.tenant.slug).toBe('test-tenant');
      expect(tenantRepository.tenants).toHaveLength(1);
      expect(tenantRepository.subscriptions).toHaveLength(1);
      expect(tenantRepository.subscriptions[0].planId).toBe('plan-free');
      expect(tenantRepository.subscriptions[0].status).toBe('ACTIVE');
    }

    expect(eventPublisher.publishedEvents.length).toBeGreaterThan(0);
  });

  it('should not create a tenant with an invalid CNPJ', async () => {
    const response = await sut.execute({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: '11111111111111', // Invalid CNPJ
      planId: 'plan-free',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(TenantValidationError);
  });

  it('should not create a tenant if document already exists', async () => {
    // First creation
    await sut.execute({
      name: 'Tenant 1',
      slug: 'tenant-1',
      email: 't1@example.com',
      phone: '11999999999',
      document: '12345678000195',
      planId: 'plan-free',
    });

    // Second with same document
    const response = await sut.execute({
      name: 'Tenant 2',
      slug: 'tenant-2',
      email: 't2@example.com',
      phone: '11999999999',
      document: '12345678000195',
      planId: 'plan-free',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(TenantAlreadyExistsError);
  });

  it('should not create a tenant if slug already exists', async () => {
    // First creation
    await sut.execute({
      name: 'Tenant 1',
      slug: 'tenant-1',
      email: 't1@example.com',
      phone: '11999999999',
      document: '12345678000195',
      planId: 'plan-free',
    });

    // Second with same slug but different document
    const response = await sut.execute({
      name: 'Tenant 2',
      slug: 'tenant-1',
      email: 't2@example.com',
      phone: '11999999999',
      document: '00000000000191', // Another valid CNPJ
      planId: 'plan-free',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(TenantAlreadyExistsError);
  });

  it('should not create a tenant if plan does not exist or is inactive', async () => {
    const response = await sut.execute({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: '12345678000195',
      planId: 'non-existent-plan',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(PlanNotFoundError);
  });
});
