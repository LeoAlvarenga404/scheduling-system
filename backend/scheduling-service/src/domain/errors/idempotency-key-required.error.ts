export class IdempotencyKeyRequiredError extends Error {
  constructor() {
    super("idempotencyKey is mandatory.");
  }
}
