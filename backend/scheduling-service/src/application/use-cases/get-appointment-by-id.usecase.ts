import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface GetAppointmentByIdTenantIdRequest {
  appointmentId: string;
}

export type GetAppointmentByIdTenantIdOutput = Either<
  {},
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

    return right({ appointment });
  }
}
