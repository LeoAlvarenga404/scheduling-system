import { beforeEach, describe, expect, it } from "vitest";
import { CompleteAppointmentUseCase } from "./complete-appointment.usecase";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { AppointmentCompletedEvent } from "src/domain/events/appointment-completed.event";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";
import { InMemoryDomainEventPublisher } from "src/test/publishers/in-memory-domain-event.publisher";

let sut: CompleteAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe("Complete Appointment Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new CompleteAppointmentUseCase(appointmentRepository, eventPublisher);
  });

  it("should complete confirmed appointment", async () => {
    const appointment = makeAppointment({ status: "CONFIRMED" });

    await appointmentRepository.save(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id,
      tenantId: "tenant-01",
    });

    expect(response.isRight()).toBe(true);
    expect(appointment.status).toBe("COMPLETED");
    expect(eventPublisher.publishedEvents).toHaveLength(1);
    expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(
      AppointmentCompletedEvent,
    );
    expect(eventPublisher.publishedEvents[0].eventName).toBe(
      "appointment.completed",
    );
  });

  it("should return error when appointment is not confirmed", async () => {
    const appointment = makeAppointment({ status: "HOLD" });

    await appointmentRepository.save(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id,
      tenantId: "tenant-01",
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(InvalidAppointmentStateError);
    expect(eventPublisher.publishedEvents).toHaveLength(0);
  });
});
