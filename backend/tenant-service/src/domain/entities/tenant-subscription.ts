import { Entity } from '../core/entity';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

export interface TenantSubscriptionProps {
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt: Date | null;
  suspendedAt: Date | null;
  cancelledAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class TenantSubscription extends Entity<TenantSubscriptionProps> {
  private constructor(props: TenantSubscriptionProps, id?: string) {
    super(props, id);
  }

  static create(props: TenantSubscriptionProps, id?: string): TenantSubscription {
    return new TenantSubscription({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    }, id);
  }

  get tenantId() { return this.props.tenantId; }
  get planId() { return this.props.planId; }
  get status() { return this.props.status; }
  get startedAt() { return this.props.startedAt; }
  
  suspend(): void {
    if (this.props.status !== SubscriptionStatus.ACTIVE) return;
    this.props.status = SubscriptionStatus.SUSPENDED;
    this.props.suspendedAt = new Date();
    this.props.updatedAt = new Date();
  }

  reactivate(): void {
    if (this.props.status !== SubscriptionStatus.SUSPENDED) return;
    this.props.status = SubscriptionStatus.ACTIVE;
    this.props.suspendedAt = null;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    if (this.props.status === SubscriptionStatus.CANCELLED) return;
    this.props.status = SubscriptionStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.updatedAt = new Date();
  }
}
