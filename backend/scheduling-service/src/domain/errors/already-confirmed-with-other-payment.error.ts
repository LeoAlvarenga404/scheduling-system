export class AlreadyConfirmedWithOtherPaymentError extends Error {
  constructor() {
    super("Already confirmed with other payment");
  }
}
