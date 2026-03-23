import { beforeEach, describe, expect, it } from 'vitest';
import { GetTenantUsageUseCase } from './get-tenant-usage.usecase';
import { ITenantUsageService } from './change-plan.usecase';
import { InMemoryTenantRepository } from '../../test/repositories/in-memory-tenant.repository';
import { Tenant, TenantStatus } from '../../domain/entities/tenant';
import { CNPJ } from '../../domain/value-objects/cnpj';
import { TenantNotFoundError } from '../../domain/errors/tenant-operation.errors';

class InMemoryTenantUsageService implements ITenantUsageService {
  public usage = {
    appointmentsThisMonth: 10,
    activeProfessionals: 2,
    activeRooms: 3,
  };

  async getCurrentUsage(tenantId: string) {
    return this.usage;
  }
}

let sut: GetTenantUsageUseCase;
let tenantRepository: InMemoryTenantRepository;
let usageService: InMemoryTenantUsageService;

describe('Get Tenant Usage Use Case', () => {
  beforeEach(() => {
    tenantRepository = new InMemoryTenantRepository();
    usageService = new InMemoryTenantUsageService();
    sut = new GetTenantUsageUseCase(tenantRepository, usageService);
  });

  it('should return tenant usage for a valid tenant', async () => {
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
    if (response.isRight()) {
      expect(response.value.appointmentsThisMonth).toBe(10);
      expect(response.value.activeProfessionals).toBe(2);
      expect(response.value.activeRooms).toBe(3);
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
