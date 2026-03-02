import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface CancelAppointmentRequest {
  appointmentId: string;
}

export type CancelAppointmentOutput = Either<AppointmentNotFoundError, void>;

export class CancelAppointmentUseCase implements UseCase<
  CancelAppointmentRequest,
  CancelAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    appointmentId,
  }: CancelAppointmentRequest): Promise<CancelAppointmentOutput> {
    const appointment =
      await this.appointmentRepository.getAppointmentById(appointmentId);

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    appointment.cancelAppointment();

    await this.appointmentRepository.cancelAppointment(appointmentId);

    return right(undefined);
  }
}
