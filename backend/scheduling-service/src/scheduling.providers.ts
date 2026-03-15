import type { Provider } from "@nestjs/common";
import { DomainEventPublisher } from "./application/events/domain-event-publisher";
import { CancelAppointmentUseCase } from "./application/use-cases/cancel-appointment.usecase";
import { CompleteAppointmentUseCase } from "./application/use-cases/complete-appointment.usecase";
import { ConfirmAppointmentWhenPaidUseCase } from "./application/use-cases/confirm-appointment-when-paid.usecase";
import { ConfirmAppointmentUseCase } from "./application/use-cases/confirm-appointment.usecase";
import { CreateHoldAppointmentUseCase } from "./application/use-cases/create-hold-appointment.usecase";
import { ExpireHoldsUseCase } from "./application/use-cases/expire-holds.usecase";
import { GetAppointmentByIdUseCase } from "./application/use-cases/get-appointment-by-id.usecase";
import { ListAppointmentsUseCase } from "./application/use-cases/list-appointments.usecase";
import { RescheduleAppointmentUseCase } from "./application/use-cases/reschedule-appointment.usecase";
import { AppointmentRepository } from "./domain/repositories/appointment.repository";

export const schedulingUseCaseProviders: Provider[] = [
  {
    provide: CreateHoldAppointmentUseCase,
    useFactory: (
      appointmentRepository: AppointmentRepository,
      eventPublisher: DomainEventPublisher,
    ) =>
      new CreateHoldAppointmentUseCase(appointmentRepository, eventPublisher),
    inject: [AppointmentRepository, DomainEventPublisher],
  },
  {
    provide: ConfirmAppointmentUseCase,
    useFactory: (
      appointmentRepository: AppointmentRepository,
      eventPublisher: DomainEventPublisher,
    ) => new ConfirmAppointmentUseCase(appointmentRepository, eventPublisher),
    inject: [AppointmentRepository, DomainEventPublisher],
  },
  {
    provide: ConfirmAppointmentWhenPaidUseCase,
    useFactory: (
      appointmentRepository: AppointmentRepository,
      eventPublisher: DomainEventPublisher,
    ) =>
      new ConfirmAppointmentWhenPaidUseCase(
        appointmentRepository,
        eventPublisher,
      ),
    inject: [AppointmentRepository, DomainEventPublisher],
  },
  {
    provide: CancelAppointmentUseCase,
    useFactory: (
      appointmentRepository: AppointmentRepository,
      eventPublisher: DomainEventPublisher,
    ) => new CancelAppointmentUseCase(appointmentRepository, eventPublisher),
    inject: [AppointmentRepository, DomainEventPublisher],
  },
  {
    provide: RescheduleAppointmentUseCase,
    useFactory: (
      appointmentRepository: AppointmentRepository,
      eventPublisher: DomainEventPublisher,
    ) =>
      new RescheduleAppointmentUseCase(appointmentRepository, eventPublisher),
    inject: [AppointmentRepository, DomainEventPublisher],
  },
  {
    provide: CompleteAppointmentUseCase,
    useFactory: (
      appointmentRepository: AppointmentRepository,
      eventPublisher: DomainEventPublisher,
    ) => new CompleteAppointmentUseCase(appointmentRepository, eventPublisher),
    inject: [AppointmentRepository, DomainEventPublisher],
  },
  {
    provide: ExpireHoldsUseCase,
    useFactory: (
      appointmentRepository: AppointmentRepository,
      eventPublisher: DomainEventPublisher,
    ) => new ExpireHoldsUseCase(appointmentRepository, eventPublisher),
    inject: [AppointmentRepository, DomainEventPublisher],
  },
  {
    provide: GetAppointmentByIdUseCase,
    useFactory: (appointmentRepository: AppointmentRepository) =>
      new GetAppointmentByIdUseCase(appointmentRepository),
    inject: [AppointmentRepository],
  },
  {
    provide: ListAppointmentsUseCase,
    useFactory: (appointmentRepository: AppointmentRepository) =>
      new ListAppointmentsUseCase(appointmentRepository),
    inject: [AppointmentRepository],
  },
];
