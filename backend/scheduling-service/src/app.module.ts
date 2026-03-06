import { Module } from "@nestjs/common";
import { DomainEventPublisher } from "./application/events/domain-event-publisher";
import { AppointmentRepository } from "./domain/repositories/appointment.repository";
import { PrismaModule } from "./infrastructure/database/prisma/prisma.module";
import { PrismaAppointmentRepository } from "./infrastructure/database/prisma/repositories/prisma-appointment.repository";
import { RabbitMqDomainEventPublisher } from "./infrastructure/messaging/rabbitmq/rabbitmq-domain-event.publisher";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaAppointmentRepository,
    RabbitMqDomainEventPublisher,
    {
      provide: AppointmentRepository,
      useExisting: PrismaAppointmentRepository,
    },
    {
      provide: DomainEventPublisher,
      useExisting: RabbitMqDomainEventPublisher,
    },
  ],
  exports: [AppointmentRepository, DomainEventPublisher],
})
export class AppModule {}
