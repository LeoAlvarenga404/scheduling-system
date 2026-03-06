import { beforeEach, describe, expect, it } from "vitest";
import { CancelAppointmentUseCase } from "./cancel-appointment.usecase";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { AppointmentCancelledEvent } from "src/domain/events/appointment-cancelled.event";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";
import { InMemoryDomainEventPublisher } from "src/test/publishers/in-memory-domain-event.publisher";

let sut: CancelAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe("Cancel Appointment Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new CancelAppointmentUseCase(appointmentRepository, eventPublisher);
  });

  it("should cancel appointment in HOLD or CONFIRMED", async () => {
    const appointment = makeAppointment({ status: "CONFIRMED" });

    await appointmentRepository.save(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id,
      tenantId: "tenant-01",
      reason: "customer request",
      cancelledBy: "user-01",
    });

    expect(response.isRight()).toBe(true);
    expect(appointment.status).toBe("CANCELLED");
    expect(appointment.metadata?.cancelledBy).toBe("user-01");
    expect(eventPublisher.publishedEvents).toHaveLength(1);
    expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(
      AppointmentCancelledEvent,
    );
  });

  it("should return error when trying to cancel completed appointment", async () => {
    const appointment = makeAppointment({ status: "COMPLETED" });

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
