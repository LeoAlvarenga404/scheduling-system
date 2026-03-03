import { Either, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { TenantMismatchError } from "src/domain/errors/tenant-mismatch.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface ListAppointmentByTenantIdRequest {
  tenantId: string;
}

export type ListAppointmentByTenantIdOutput = Either<
  TenantMismatchError,
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
