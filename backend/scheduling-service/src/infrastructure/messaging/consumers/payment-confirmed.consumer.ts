import { Injectable, OnModuleInit, Logger, Inject } from "@nestjs/common";
import { RabbitMQService } from "../rabbitmq.service";
import { PrismaProcessedEventRepository } from "../../database/prisma/repositories/prisma-processed-event.repository";
import { ConfirmAppointmentWhenPaidUseCase } from "src/application/use-cases/confirm-appointment-when-paid.usecase";

@Injectable()
export class PaymentConfirmedConsumer implements OnModuleInit {
  private readonly logger = new Logger(PaymentConfirmedConsumer.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly processedEventRepository: PrismaProcessedEventRepository,
    @Inject(ConfirmAppointmentWhenPaidUseCase)
    private readonly confirmAppointmentWhenPaidUseCase: ConfirmAppointmentWhenPaidUseCase,
  ) {}

  async onModuleInit() {
    await this.rabbitMQService.startConsumer(
      "scheduling.payment.confirmed", // queue name
      "payment.confirmed", // routing key
      async (msg) => this.handleMessage(msg)
    );
  }

  private async handleMessage(msg: any): Promise<void> {
    try {
      const content = JSON.parse(msg.content.toString());
      const { id: eventId, tenantId, payload } = content;

      if (!eventId || !tenantId || !payload) {
        this.logger.warn("Invalid message format: missing required fields");
        return;
      }

      const alreadyProcessed = await this.processedEventRepository.exists(eventId, tenantId);
      if (alreadyProcessed) {
        this.logger.log(`Message ${eventId} already processed, skipping.`);
        return;
      }

      const response = await this.confirmAppointmentWhenPaidUseCase.execute({
        tenantId,
        externalRef: payload.externalRef,
        paymentRef: payload.paymentRef,
        paidAt: payload.paidAt ? new Date(payload.paidAt) : new Date(),
      });

      if (response.isLeft()) {
         this.logger.error(`Failed to confirm appointment: ${response.value.message}`);
      }

      await this.processedEventRepository.save(eventId, tenantId, "payment.confirmed");
      this.logger.log(`Message ${eventId} processed successfully.`);
    } catch (error) {
      this.logger.error("Error processing payment.confirmed message", error);
      throw error;
    }
  }
}
