import { beforeEach, describe, expect, it } from 'vitest';
import { CancelTenantUseCase } from './cancel-tenant.usecase';
import { InMemoryTenantRepository } from '../../test/repositories/in-memory-tenant.repository';
import { InMemoryDomainEventPublisher } from '../../test/publishers/in-memory-domain-event.publisher';
import { Tenant, TenantStatus } from '../../domain/entities/tenant';
import { TenantSubscription, SubscriptionStatus } from '../../domain/entities/tenant-subscription';
import { CNPJ } from '../../domain/value-objects/cnpj';
import { TenantNotFoundError, TenantInvalidStateError } from '../../domain/errors/tenant-operation.errors';
import { InMemoryTenantSubscriptionRepository } from 'src/test/repositories/in-memory-tenant-subscription.repository';

let sut: CancelTenantUseCase;
let tenantRepository: InMemoryTenantRepository;
let subscriptionRepository: InMemoryTenantSubscriptionRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe('Cancel Tenant Use Case', () => {
  beforeEach(() => {
    tenantRepository = new InMemoryTenantRepository();
    subscriptionRepository = new InMemoryTenantSubscriptionRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new CancelTenantUseCase(tenantRepository, subscriptionRepository, eventPublisher);
  });

  it('should cancel an active tenant and its subscription', async () => {
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
    });

    expect(response.isRight()).toBe(true);
    expect(tenant.status).toBe(TenantStatus.CANCELLED);
    expect(subscription.status).toBe(SubscriptionStatus.CANCELLED);
    expect(subscription.props.cancelledAt).toBeInstanceOf(Date);
    expect(eventPublisher.publishedEvents).toHaveLength(1);
  });

  it('should not cancel a non-existent tenant', async () => {
    const response = await sut.execute({
      tenantId: 'non-existent',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(TenantNotFoundError);
  });

  it('should not cancel a tenant that is already CANCELLED', async () => {
    const tenant = Tenant.restore({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: CNPJ.create('12345678000195'),
      status: TenantStatus.CANCELLED,
      activeSubscriptionId: 'sub-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, 'tenant-1');
    
    await tenantRepository.save(tenant);

    const response = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(TenantInvalidStateError);
  });
});
