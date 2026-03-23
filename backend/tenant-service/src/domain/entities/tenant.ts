import { Entity } from '../core/entity';
import { CNPJ } from '../value-objects/cnpj';
import { PlanLimits } from '../value-objects/plan-limits';
import { 
  TenantCreatedEvent, 
  TenantActivatedEvent, 
  TenantSuspendedEvent, 
  TenantReactivatedEvent, 
  TenantCancelledEvent, 
  TenantPlanChangedEvent 
} from '../events/tenant-events';

export enum TenantStatus {
  PENDING_SETUP = 'PENDING_SETUP',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED'
}

export interface TenantProps {
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  document: CNPJ;
  status: TenantStatus;
  activeSubscriptionId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Tenant extends Entity<TenantProps> {
  private constructor(props: TenantProps, id?: string) {
    super(props, id);
  }

  static create(props: Omit<TenantProps, 'status' | 'activeSubscriptionId'>, id?: string): Tenant {
    const tenant = new Tenant({
      ...props,
      status: TenantStatus.PENDING_SETUP,
      activeSubscriptionId: null,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date()
    }, id);

    tenant.addDomainEvent(new TenantCreatedEvent(
      tenant.id,
      tenant.name,
      tenant.slug,
      tenant.document.getValue(),
      tenant.email,
      tenant.status
    ));

    return tenant;
  }

  static restore(props: TenantProps, id: string): Tenant {
    return new Tenant(props, id);
  }

  get name() { return this.props.name; }
  get slug() { return this.props.slug; }
  get email() { return this.props.email; }
  get phone() { return this.props.phone; }
  get document() { return this.props.document; }
  get status() { return this.props.status; }
  get activeSubscriptionId() { return this.props.activeSubscriptionId; }

  setActiveSubscription(subscriptionId: string): void {
    this.props.activeSubscriptionId = subscriptionId;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    if (this.props.status !== TenantStatus.PENDING_SETUP) {
      throw new Error('Tenant can only be activated from PENDING_SETUP state');
    }
    
    this.props.status = TenantStatus.ACTIVE;
    this.props.updatedAt = new Date();
    
    this.addDomainEvent(new TenantActivatedEvent(this.id, this.status));
  }

  suspend(reason: string): void {
    if (this.props.status !== TenantStatus.ACTIVE) {
      throw new Error('Only active tenants can be suspended');
    }
    
    this.props.status = TenantStatus.SUSPENDED;
    this.props.updatedAt = new Date();
    
    this.addDomainEvent(new TenantSuspendedEvent(this.id, this.status, reason));
  }

  reactivate(): void {
    if (this.props.status !== TenantStatus.SUSPENDED) {
      throw new Error('Only suspended tenants can be reactivated');
    }
    
    this.props.status = TenantStatus.ACTIVE;
    this.props.updatedAt = new Date();
    
    this.addDomainEvent(new TenantReactivatedEvent(this.id, this.status));
  }

  cancel(): void {
    if (this.props.status === TenantStatus.CANCELLED) {
      throw new Error('Tenant is already cancelled');
    }
    
    this.props.status = TenantStatus.CANCELLED;
    this.props.updatedAt = new Date();
    
    this.addDomainEvent(new TenantCancelledEvent(this.id, this.status));
  }

  changePlan(newSubscriptionId: string, previousPlanName: string, newPlanName: string, newLimits: PlanLimits): void {
    if (this.props.status !== TenantStatus.ACTIVE) {
      throw new Error('Cannot change plan of an inactive tenant');
    }
    
    this.setActiveSubscription(newSubscriptionId);
    
    this.addDomainEvent(new TenantPlanChangedEvent(
      this.id,
      newSubscriptionId,
      previousPlanName,
      newPlanName,
      newLimits
    ));
  }
}
