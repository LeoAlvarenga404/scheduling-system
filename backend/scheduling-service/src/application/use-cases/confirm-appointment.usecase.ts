import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { HoldExpiredError } from "src/domain/errors/hold-expired.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface ConfirmAppointmentRequest {
  appointmentId: string;
  tenantId: string;
  now?: Date;
}

export type ConfirmAppointmentOutput = Either<
  AppointmentNotFoundError | HoldExpiredError | InvalidAppointmentStateError,
  {
    appointment: Appointment;
  }
>;

export class ConfirmAppointmentUseCase implements UseCase<
  ConfirmAppointmentRequest,
  ConfirmAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute({
    appointmentId,
    tenantId,
    now,
  }: ConfirmAppointmentRequest): Promise<ConfirmAppointmentOutput> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId,
      tenantId,
    );

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    if (appointment.status.value === "CONFIRMED") {
      return right({ appointment });
    }

    if (appointment.status.value !== "HOLD") {
      return left(
        new InvalidAppointmentStateError(
          "Only appointments in HOLD can be confirmed.",
        ),
      );
    }

    const referenceDate = now ?? new Date();

    if (appointment.isHoldExpired(referenceDate)) {
      appointment.expireHold(referenceDate);
      await this.appointmentRepository.updateAppointment(appointment);

      return left(new HoldExpiredError());
    }

    appointment.confirm(referenceDate);
    await this.appointmentRepository.updateAppointment(appointment);

    return right({ appointment });
  }
}
