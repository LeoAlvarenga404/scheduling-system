import { Module } from "@nestjs/common";
import { DomainEventPublisher } from "./application/events/domain-event-publisher";
import { NoopDomainEventPublisher } from "./application/events/noop-domain-event.publisher";
import { AppointmentRepository } from "./domain/repositories/appointment.repository";
import { PrismaModule } from "./infrastructure/database/prisma/prisma.module";
import { PrismaAppointmentRepository } from "./infrastructure/database/prisma/repositories/prisma-appointment.repository";
import { AppointmentsController } from "./infrastructure/http/appointments/appointments.controller";
import { HealthController } from "./infrastructure/http/health.controller";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";
import { PaymentConfirmedConsumer } from "./infrastructure/messaging/consumers/payment-confirmed.consumer";
import { PrismaProcessedEventRepository } from "./infrastructure/database/prisma/repositories/prisma-processed-event.repository";

import { schedulingUseCaseProviders } from "./scheduling.providers";

@Module({
  imports: [PrismaModule, MessagingModule],
  controllers: [HealthController, AppointmentsController],
  providers: [
    PrismaAppointmentRepository,
    {
      provide: DomainEventPublisher,
      useValue: new NoopDomainEventPublisher(),
    },
    {
      provide: AppointmentRepository,
      useExisting: PrismaAppointmentRepository,
    },
    ...schedulingUseCaseProviders,
    PrismaProcessedEventRepository,
    PaymentConfirmedConsumer,
  ],
})
export class SchedulingModule {}
