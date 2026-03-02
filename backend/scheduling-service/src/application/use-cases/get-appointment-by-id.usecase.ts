import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface GetAppointmentByIdTenantIdRequest {
  appointmentId: string;
}

export type GetAppointmentByIdTenantIdOutput = Either<
  AppointmentNotFoundError,
  {
    appointment: Appointment;
  }
>;

export class GetAppointmentByIdTenantIdUseCase implements UseCase<
  GetAppointmentByIdTenantIdRequest,
  GetAppointmentByIdTenantIdOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    appointmentId,
  }: GetAppointmentByIdTenantIdRequest): Promise<GetAppointmentByIdTenantIdOutput> {
    const appointment =
      await this.appointmentRepository.getAppointmentById(appointmentId);

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    return right({ appointment });
  }
}
