export class HoldExpiredError extends Error {
  constructor() {
    super("HOLD_EXPIRED");
  }
}
