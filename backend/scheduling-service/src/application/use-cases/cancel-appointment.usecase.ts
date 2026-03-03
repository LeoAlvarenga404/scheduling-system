import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { TenantMismatchError } from "src/domain/errors/tenant-mismatch.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface CancelAppointmentRequest {
  appointmentId: string;
  tenantId: string;
}

export type CancelAppointmentOutput = Either<
  AppointmentNotFoundError | TenantMismatchError,
  void
>;

export class CancelAppointmentUseCase implements UseCase<
  CancelAppointmentRequest,
  CancelAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    appointmentId,
    tenantId,
  }: CancelAppointmentRequest): Promise<CancelAppointmentOutput> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId,
      tenantId,
    );

    if (appointment?.tenantId !== tenantId) {
      return left(new TenantMismatchError());
    }
    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    appointment.cancelAppointment();

    await this.appointmentRepository.cancelAppointment(appointmentId);

    return right(undefined);
  }
}
