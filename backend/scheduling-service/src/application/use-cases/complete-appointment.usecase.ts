import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { TenantMismatchError } from "src/domain/errors/tenant-mismatch.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface CompleteAppointmentRequest {
  appointmentId: string;
  tenantId: string;
}

export type CompleteAppointmentOutput = Either<
  AppointmentNotFoundError | TenantMismatchError,
  void
>;

export class CompleteAppointmentUseCase implements UseCase<
  CompleteAppointmentRequest,
  CompleteAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    appointmentId,
    tenantId,
  }: CompleteAppointmentRequest): Promise<CompleteAppointmentOutput> {
    const appointment =
      await this.appointmentRepository.getAppointmentById(appointmentId);

    if (appointment?.tenantId !== tenantId) {
      return left(new TenantMismatchError());
    }
    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }
    appointment.completeAppointment();

    await this.appointmentRepository.completeAppointment(appointmentId);

    return right(undefined);
  }
}
