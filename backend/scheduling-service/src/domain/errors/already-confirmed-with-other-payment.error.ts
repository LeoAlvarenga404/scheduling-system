export class AlreadyConfirmedWithOtherPaymentError extends Error {
  constructor() {
    super("ALREADY_CONFIRMED_WITH_OTHER_PAYMENT");
  }
}
