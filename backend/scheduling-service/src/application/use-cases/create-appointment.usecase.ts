import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export type CreateAppointmentRequest = Appointment;

export type CreateAppointmentOutput = Either<
  {},
  {
    appointment: Appointment;
  }
>;

export class CreateAppointmentUseCase implements UseCase<
  CreateAppointmentRequest,
  CreateAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    customerId,
    professionalId,
    scheduledAt,
    tenantId,
    status,
  }: CreateAppointmentRequest): Promise<CreateAppointmentOutput> {
    let appointment;

    appointment = Appointment.create({
      customerId,
      professionalId,
      scheduledAt,
      status,
      tenantId,
    });

    await this.appointmentRepository.createAppointment(appointment);

    return right({ appointment });
  }
}
