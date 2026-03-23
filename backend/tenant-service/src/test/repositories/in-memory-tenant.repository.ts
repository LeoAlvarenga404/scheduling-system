import { ITenantRepository, ITenantSubscriptionRepository } from '../../domain/repositories/tenant-repository.interface';
import { Tenant } from '../../domain/entities/tenant';
import { TenantSubscription } from '../../domain/entities/tenant-subscription';

export class InMemoryTenantRepository implements ITenantRepository {
  public tenants: Tenant[] = [];
  public subscriptions: TenantSubscription[] = [];

  async findById(id: string): Promise<Tenant | null> {
    const tenant = this.tenants.find(t => t.id === id);
    return tenant || null;
  }

  async findByDocument(document: string): Promise<Tenant | null> {
    const tenant = this.tenants.find(t => t.document.getValue() === document);
    return tenant || null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = this.tenants.find(t => t.slug === slug);
    return tenant || null;
  }

  async save(
    tenant: Tenant,
    newSubscription?: TenantSubscription,
    cancelledSubscription?: TenantSubscription
  ): Promise<void> {
    const index = this.tenants.findIndex(t => t.id === tenant.id);
    if (index >= 0) {
      this.tenants[index] = tenant;
    } else {
      this.tenants.push(tenant);
    }

    if (newSubscription) {
      this.subscriptions.push(newSubscription);
    }

    if (cancelledSubscription) {
      const subIndex = this.subscriptions.findIndex(s => s.id === cancelledSubscription.id);
      if (subIndex >= 0) {
        this.subscriptions[subIndex] = cancelledSubscription;
      }
    }
  }

  async update(
    tenant: Tenant,
    subscriptionsToUpdate?: TenantSubscription[]
  ): Promise<void> {
    const index = this.tenants.findIndex(t => t.id === tenant.id);
    if (index >= 0) {
      this.tenants[index] = tenant;
    }

    if (subscriptionsToUpdate) {
      subscriptionsToUpdate.forEach(sub => {
        const subIndex = this.subscriptions.findIndex(s => s.id === sub.id);
        if (subIndex >= 0) {
          this.subscriptions[subIndex] = sub;
        } else {
          this.subscriptions.push(sub);
        }
      });
    }
  }

}

