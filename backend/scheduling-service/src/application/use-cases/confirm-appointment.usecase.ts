import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface ConfirmAppointmentRequest {
  appointmentId: string;
}

export type ConfirmAppointmentOutput = Either<AppointmentNotFoundError, void>;

export class ConfirmAppointmentUseCase implements UseCase<
  ConfirmAppointmentRequest,
  ConfirmAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    appointmentId,
  }: ConfirmAppointmentRequest): Promise<ConfirmAppointmentOutput> {
    const appointment =
      await this.appointmentRepository.getAppointmentById(appointmentId);
    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }
    appointment.confirmAppointment();

    await this.appointmentRepository.confirmAppointment(appointmentId);

    return right(undefined);
  }
}
