export class AppointmentNotFoundError extends Error {
  constructor() {
    super("Appointment not found.");
  }
}
