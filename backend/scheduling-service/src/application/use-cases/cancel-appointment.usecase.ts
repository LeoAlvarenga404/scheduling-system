import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

export interface CancelAppointmentRequest {
  appointmentId: string;
  tenantId: string;
  reason?: string;
  cancelledBy?: string;
}

export type CancelAppointmentOutput = Either<
  AppointmentNotFoundError | InvalidAppointmentStateError,
  {
    appointment: Appointment;
  }
>;

export class CancelAppointmentUseCase
  implements UseCase<CancelAppointmentRequest, CancelAppointmentOutput>
{
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute({
    appointmentId,
    tenantId,
    reason,
    cancelledBy,
  }: CancelAppointmentRequest): Promise<CancelAppointmentOutput> {
    const appointment = await this.appointmentRepository.getAppointmentById(
      appointmentId,
      tenantId,
    );

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    if (appointment.status.value === "CANCELLED") {
      return right({ appointment });
    }

    if (appointment.status.value === "EXPIRED") {
      return right({ appointment });
    }

    if (appointment.status.value !== "HOLD" && appointment.status.value !== "CONFIRMED") {
      return left(
        new InvalidAppointmentStateError(
          "Only HOLD or CONFIRMED appointments can be cancelled.",
        ),
      );
    }

    appointment.cancel({ reason, cancelledBy });
    await this.appointmentRepository.updateAppointment(appointment);

    return right({ appointment });
  }
}
