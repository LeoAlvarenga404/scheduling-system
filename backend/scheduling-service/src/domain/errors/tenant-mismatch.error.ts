export class TenantMismatchError extends Error {
  constructor() {
    super("Tenant mismatch.");
  }
}
