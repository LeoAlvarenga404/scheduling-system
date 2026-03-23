export class TenantValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantValidationError';
  }
}

export class TenantAlreadyExistsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantAlreadyExistsError';
  }
}

export class PlanNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanNotFoundError';
  }
}
