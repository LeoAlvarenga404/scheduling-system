import { Either, right, left } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { TenantMismatchError } from "src/domain/errors/tenant-mismatch.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface RescheduleAppointmentRequest {
  appointmentId: string;
  newStartDate: Date;
  newEndDate: Date;
  tenantId: string;
}

export type RescheduleAppointmentOutput = Either<
  TenantMismatchError | AppointmentNotFoundError,
  void
>;

export class RescheduleAppointmentUseCase implements UseCase<
  RescheduleAppointmentRequest,
  RescheduleAppointmentOutput
> {
  constructor(private appointmentRepository: AppointmentRepository) {}
  async execute({
    appointmentId,
    tenantId,
    newStartDate,
    newEndDate,
  }: RescheduleAppointmentRequest): Promise<RescheduleAppointmentOutput> {
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

    appointment.reschedule({
      startDate: newStartDate,
      endDate: newEndDate,
    });

    await this.appointmentRepository.update(appointment);

    return right(undefined);
  }
}
