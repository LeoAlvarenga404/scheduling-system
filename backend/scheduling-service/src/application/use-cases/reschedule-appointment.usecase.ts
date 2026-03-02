import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface RescheduleAppointmentRequest {
  appointmentId: string;
  newScheduleDate: Date;
}

export type RescheduleAppointmentOutput = Either<{}, void>;

export class RescheduleAppointmentUseCase implements UseCase<
  RescheduleAppointmentRequest,
  RescheduleAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    appointmentId,
    newScheduleDate,
  }: RescheduleAppointmentRequest): Promise<RescheduleAppointmentOutput> {
    const appointment =
      await this.appointmentRepository.getAppointmentById(appointmentId);

    if (!appointment) {
      throw new Error("Appointment not exists");
    }

    appointment.reschedule(newScheduleDate);

    await this.appointmentRepository.update(appointment);

    return right(undefined);
  }
}
