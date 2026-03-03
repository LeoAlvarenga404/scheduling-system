import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { TenantMismatchError } from "src/domain/errors/tenant-mismatch.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface ConfirmAppointmentRequest {
  appointmentId: string;
  tenantId: string;
}

export type ConfirmAppointmentOutput = Either<
  AppointmentNotFoundError | TenantMismatchError,
  void
>;

export class ConfirmAppointmentUseCase implements UseCase<
  ConfirmAppointmentRequest,
  ConfirmAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    appointmentId,
    tenantId,
  }: ConfirmAppointmentRequest): Promise<ConfirmAppointmentOutput> {
    const appointment =
      await this.appointmentRepository.getAppointmentById(appointmentId);

    if (appointment?.tenantId !== tenantId) {
      return left(new TenantMismatchError());
    }
    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }
    appointment.confirmAppointment();

    await this.appointmentRepository.confirmAppointment(appointmentId);

    return right(undefined);
  }
}
