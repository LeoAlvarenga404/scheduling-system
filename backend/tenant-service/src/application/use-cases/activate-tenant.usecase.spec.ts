import { beforeEach, describe, expect, it } from 'vitest';
import { ActivateTenantUseCase } from './activate-tenant.usecase';
import { InMemoryTenantRepository } from '../../test/repositories/in-memory-tenant.repository';
import { InMemoryDomainEventPublisher } from '../../test/publishers/in-memory-domain-event.publisher';
import { Tenant, TenantStatus } from '../../domain/entities/tenant';
import { CNPJ } from '../../domain/value-objects/cnpj';
import { TenantNotFoundError, TenantInvalidStateError } from '../../domain/errors/tenant-operation.errors';

let sut: ActivateTenantUseCase;
let tenantRepository: InMemoryTenantRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe('Activate Tenant Use Case', () => {
  beforeEach(() => {
    tenantRepository = new InMemoryTenantRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new ActivateTenantUseCase(tenantRepository, eventPublisher);
  });

  it('should activate a PENDING_SETUP tenant', async () => {
    const tenant = Tenant.create({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: CNPJ.create('12345678000195'),
    }, 'tenant-1');
    
    await tenantRepository.save(tenant);

    const response = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(response.isRight()).toBe(true);
    expect(tenant.status).toBe(TenantStatus.ACTIVE);
    expect(tenantRepository.tenants[0].status).toBe(TenantStatus.ACTIVE);
    expect(eventPublisher.publishedEvents).toHaveLength(2);
  });

  it('should not activate a non-existent tenant', async () => {
    const response = await sut.execute({
      tenantId: 'non-existent',
    });

    expect(response.isLeft()).toBe(true);
    expect(response.value).toBeInstanceOf(TenantNotFoundError);
  });

  it('should not activate a tenant that is NOT in PENDING_SETUP state', async () => {
    const tenant = Tenant.restore({
      name: 'Test Tenant',
      slug: 'test-tenant',
      email: 'test@example.com',
      phone: '11999999999',
      document: CNPJ.create('12345678000195'),
      status: TenantStatus.ACTIVE, // Already active
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
