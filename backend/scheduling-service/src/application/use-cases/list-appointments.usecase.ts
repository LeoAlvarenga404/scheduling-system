import { Either, left, right } from "src/domain/core/entities/either";
import { UseCase } from "src/domain/core/entities/use-case";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentValidationError } from "src/domain/errors/appointment-validation.error";
import {
  AppointmentRepository,
  ListAppointmentsFilters,
} from "src/domain/repositories/appointment.repository";

export type ListAppointmentsRequest = ListAppointmentsFilters;

export type ListAppointmentsOutput = Either<
  AppointmentValidationError,
  {
    appointments: Appointment[];
  }
>;

export class ListAppointmentsUseCase
  implements UseCase<ListAppointmentsRequest, ListAppointmentsOutput>
{
  constructor(private appointmentRepository: AppointmentRepository) {}

  async execute({
    tenantId,
    dateFrom,
    dateTo,
    roomId,
    responsibleProfessionalId,
    participantProfessionalId,
    status,
  }: ListAppointmentsRequest): Promise<ListAppointmentsOutput> {
    if (!tenantId) {
      return left(new AppointmentValidationError("tenantId is mandatory."));
    }

    if (dateFrom && dateTo && dateTo.getTime() <= dateFrom.getTime()) {
      return left(
        new AppointmentValidationError("dateTo must be greater than dateFrom."),
      );
    }

    const appointments = await this.appointmentRepository.listAppointments({
      tenantId,
      dateFrom,
      dateTo,
      roomId,
      responsibleProfessionalId,
      participantProfessionalId,
      status,
    });

    return right({ appointments });
  }
}
