import { beforeEach, describe, expect, it } from "vitest";
import { ConfirmAppointmentUseCase } from "./confirm-appointment.usecase";
import { HoldExpiredError } from "src/domain/errors/hold-expired.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { AppointmentConfirmedEvent } from "src/domain/events/appointment-confirmed.event";
import { AppointmentExpiredEvent } from "src/domain/events/appointment-expired.event";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";
import { InMemoryDomainEventPublisher } from "src/test/publishers/in-memory-domain-event.publisher";

let sut: ConfirmAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe("Confirm Appointment Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new ConfirmAppointmentUseCase(appointmentRepository, eventPublisher);
  });

  it("should confirm an appointment in HOLD", async () => {
    const appointment = makeAppointment();

    await appointmentRepository.save(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id,
      tenantId: "tenant-01",
      now: new Date("2026-03-10T12:05:00.000Z"),
    });

    expect(response.isRight()).toBe(true);
    expect(appointment.status).toBe("CONFIRMED");
    expect(appointment.holdExpiresAt).toBeUndefined();
    expect(eventPublisher.publishedEvents).toHaveLength(1);
    expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(
      AppointmentConfirmedEvent,
    );
  });

  it("should expire hold when trying to confirm after expiration", async () => {
    const appointment = makeAppointment({
      holdExpiresAt: new Date("2026-03-10T12:05:00.000Z"),
    });

    await appointmentRepository.save(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id,
      tenantId: "tenant-01",
      now: new Date("2026-03-10T12:06:00.000Z"),
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(HoldExpiredError);
    expect(appointment.status).toBe("EXPIRED");
    expect(eventPublisher.publishedEvents).toHaveLength(1);
    expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(
      AppointmentExpiredEvent,
    );
  });

  it("should return error when appointment is not in HOLD", async () => {
    const appointment = makeAppointment({ status: "CANCELLED" });

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
