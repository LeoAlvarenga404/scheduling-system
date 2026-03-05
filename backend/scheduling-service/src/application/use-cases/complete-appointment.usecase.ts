import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface CompleteAppointmentRequest {
  appointmentId: string;
  tenantId: string;
}

export type CompleteAppointmentOutput = Either<
  AppointmentNotFoundError | InvalidAppointmentStateError,
  {
    appointment: Appointment;
  }
>;

export class CompleteAppointmentUseCase implements UseCase<
  CompleteAppointmentRequest,
  CompleteAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute({
    appointmentId,
    tenantId,
  }: CompleteAppointmentRequest): Promise<CompleteAppointmentOutput> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId,
      tenantId,
    );

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    if (appointment.status.value === "COMPLETED") {
      return right({ appointment });
    }

    if (appointment.status.value !== "CONFIRMED") {
      return left(
        new InvalidAppointmentStateError(
          "Only CONFIRMED appointments can be completed.",
        ),
      );
    }

    appointment.complete();
    await this.appointmentRepository.updateAppointment(appointment);

    return right({ appointment });
  }
}
