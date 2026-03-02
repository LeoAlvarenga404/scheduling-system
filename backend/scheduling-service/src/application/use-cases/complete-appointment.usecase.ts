import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface CompleteAppointmentRequest {
  appointmentId: string;
}

export type CompleteAppointmentOutput = Either<{}, void>;

export class CompleteAppointmentUseCase implements UseCase<
  CompleteAppointmentRequest,
  CompleteAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    appointmentId,
  }: CompleteAppointmentRequest): Promise<CompleteAppointmentOutput> {
    const appointment =
      await this.appointmentRepository.getAppointmentById(appointmentId);

    appointment?.completeAppointment();

    await this.appointmentRepository.completeAppointment(appointmentId);

    return right(undefined);
  }
}
