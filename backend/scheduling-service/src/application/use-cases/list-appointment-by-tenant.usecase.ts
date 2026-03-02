import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface ListAppointmentByTenantIdRequest {
  tenantId: string;
}

export type ListAppointmentByTenantIdOutput = Either<
  {},
  {
    appointments: Appointment[];
  }
>;

export class ListAppointmentByTenantIdUseCase implements UseCase<
  ListAppointmentByTenantIdRequest,
  ListAppointmentByTenantIdOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    tenantId,
  }: ListAppointmentByTenantIdRequest): Promise<ListAppointmentByTenantIdOutput> {
    const appointments =
      await this.appointmentRepository.listAppointmentByTenantId(tenantId);

    return right({ appointments });
  }
}
