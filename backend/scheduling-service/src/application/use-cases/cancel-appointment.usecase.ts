import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface CancelAppointmentRequest {
  appointmentId: string;
}

export type CancelAppointmentOutput = Either<{}, void>;

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

    appointment?.cancelAppointment();

    await this.appointmentRepository.cancelAppointment(appointmentId);

    return right(undefined);
  }
}
