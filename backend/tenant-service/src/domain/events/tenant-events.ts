import { TenantStatus } from '../entities/tenant';

export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly version: number = 1;

  constructor(public readonly correlationId?: string) {
    this.occurredAt = new Date();
  }
}

export class TenantCreatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly document: string,
    public readonly email: string | null,
    public readonly status: TenantStatus,
    correlationId?: string
  ) {
    super(correlationId);
  }
}

export class TenantActivatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly status: TenantStatus,
    correlationId?: string
  ) {
    super(correlationId);
  }
}

export class TenantSuspendedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly status: TenantStatus,
    public readonly reason: string,
    correlationId?: string
  ) {
    super(correlationId);
  }
}

export class TenantReactivatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly status: TenantStatus,
    correlationId?: string
  ) {
    super(correlationId);
  }
}

export class TenantCancelledEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly status: TenantStatus,
    correlationId?: string
  ) {
    super(correlationId);
  }
}

export class TenantPlanChangedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly activeSubscriptionId: string,
    public readonly previousPlanName: string,
    public readonly newPlanName: string,
    public readonly newLimits: any,
    correlationId?: string
  ) {
    super(correlationId);
  }
}
