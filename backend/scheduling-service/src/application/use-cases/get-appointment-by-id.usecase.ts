import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface GetAppointmentByIdRequest {
  appointmentId: string;
  tenantId: string;
}

export type GetAppointmentByIdOutput = Either<
  AppointmentNotFoundError,
  {
    appointment: Appointment;
  }
>;

export class GetAppointmentByIdUseCase
  implements UseCase<GetAppointmentByIdRequest, GetAppointmentByIdOutput>
{
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute({
    appointmentId,
    tenantId,
  }: GetAppointmentByIdRequest): Promise<GetAppointmentByIdOutput> {
    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    return right({ appointment });
  }
}

