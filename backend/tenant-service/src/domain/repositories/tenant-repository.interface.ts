import { Tenant } from '../entities/tenant'
import { SubscriptionPlan } from '../entities/subscription-plan';
import { TenantSubscription } from '../entities/tenant-subscription';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findByDocument(document: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(
    tenant: Tenant,
    newSubscription?: TenantSubscription,
    cancelledSubscription?: TenantSubscription
  ): Promise<void>;
  update(
    tenant: Tenant,
    subscriptionsToUpdate?: TenantSubscription[]
  ): Promise<void>;
}

export interface ISubscriptionPlanRepository {
  findById(id: string): Promise<SubscriptionPlan | null>;
  findAll(): Promise<SubscriptionPlan[]>;
}

export interface ITenantSubscriptionRepository {
  findById(id: string): Promise<TenantSubscription | null>;
  findActiveByTenantId(tenantId: string): Promise<TenantSubscription | null>;
}
