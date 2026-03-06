import { left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { AppointmentRepository } from "src/domain/repositories/appointment.repository";

import type { Either } from "src/domain/core/entities/either";
import type { Appointment } from "src/domain/entities/appointment";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { DomainEventPublisher } from "src/application/events/domain-event-publisher";
import { NoopDomainEventPublisher } from "src/application/events/noop-domain-event.publisher";
import { publishAppointmentEvents } from "src/application/events/publish-appointment-events";

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
  constructor(
    private appointmentRepository: AppointmentRepository,
    private readonly eventPublisher: DomainEventPublisher =
      new NoopDomainEventPublisher(),
  ) {}

  async execute({
    appointmentId,
    tenantId,
    reason,
    cancelledBy,
  }: CancelAppointmentRequest): Promise<CancelAppointmentOutput> {
    const appointment = await this.appointmentRepository.findById(
      appointmentId,
      tenantId,
    );

    if (!appointment) {
      return left(new AppointmentNotFoundError());
    }

    if (appointment.status === "CANCELLED" || appointment.status === "EXPIRED") {
      return right({ appointment });
    }

    if (appointment.status !== "HOLD" && appointment.status !== "CONFIRMED") {
      return left(
        new InvalidAppointmentStateError(
          "Only HOLD or CONFIRMED appointments can be cancelled.",
        ),
      );
    }

    appointment.cancel({ reason, cancelledBy });
    await this.appointmentRepository.save(appointment);
    await publishAppointmentEvents(appointment, this.eventPublisher);

    return right({ appointment });
  }
}

