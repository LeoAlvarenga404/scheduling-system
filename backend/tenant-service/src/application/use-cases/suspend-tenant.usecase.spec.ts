import { beforeEach, describe, expect, it } from 'vitest';
import { SuspendTenantUseCase } from './suspend-tenant.usecase';
import { InMemoryTenantRepository } from '../../test/repositories/in-memory-tenant.repository';
import { InMemoryDomainEventPublisher } from '../../test/publishers/in-memory-domain-event.publisher';
import { Tenant, TenantStatus } from '../../domain/entities/tenant';
import { TenantSubscription, SubscriptionStatus } from '../../domain/entities/tenant-subscription';
import { CNPJ } from '../../domain/value-objects/cnpj';
import { TenantNotFoundError, TenantInvalidStateError } from '../../domain/errors/tenant-operation.errors';
import { InMemoryTenantSubscriptionRepository } from 'src/test/repositories/in-memory-tenant-subscription.repository';

let sut: SuspendTenantUseCase;
let tenantRepository: InMemoryTenantRepository;
let subscriptionRepository: InMemoryTenantSubscriptionRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe('Suspend Tenant Use Case', () => {
  beforeEach(() => {
    tenantRepository = new InMemoryTenantRepository();
    subscriptionRepository = new InMemoryTenantSubscriptionRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new SuspendTenantUseCase(tenantRepository, subscriptionRepository, eventPublisher);
  });

  it('should suspend an active tenant and its active subscription', async () => {
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
      planId: 'plan-1',
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
      reason: 'Payment issue',
    });

    expect(response.isRight()).toBe(true);
    expect(tenant.status).toBe(TenantStatus.SUSPENDED);
    expect(subscription.status).toBe(SubscriptionStatus.SUSPENDED);
    expect(subscription.props.suspendedAt).toBeInstanceOf(Date);
    expect(eventPublisher.publishedEvents).toHaveLength(1);
  });

  it('should return error for non-existent tenant', async () => {
    const response = await sut.execute({
      tenantId: 'non-existent',
      reason: 'foo',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(TenantNotFoundError);
  });

  it('should not suspend a tenant that is NOT ACTIVE', async () => {
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
      reason: 'foo',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(TenantInvalidStateError);
  });
});
