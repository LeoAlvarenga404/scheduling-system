import { ITenantSubscriptionRepository } from "src/domain/repositories/tenant-repository.interface";
import { TenantSubscription } from "src/domain/entities/tenant-subscription";

export class InMemoryTenantSubscriptionRepository implements ITenantSubscriptionRepository {
  public items: TenantSubscription[] = [];

  async findById(id: string): Promise<TenantSubscription | null> {
    return this.items.find(s => s.id === id) || null;
  }

  async findActiveByTenantId(tenantId: string): Promise<TenantSubscription | null> {
    return this.items.find(s => s.tenantId === tenantId && s.status === 'ACTIVE') || null;
  }
}
