export class TenantNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantNotFoundError';
  }
}

export class TenantInvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantInvalidStateError';
  }
}

export class PlanDowngradeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanDowngradeError';
  }
}
