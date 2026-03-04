import { beforeEach, describe, expect, it } from "vitest";
import { ConfirmAppointmentUseCase } from "./confirm-appointment.usecase";
import { HoldExpiredError } from "src/domain/errors/hold-expired.error";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";

let sut: ConfirmAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("Confirm Appointment Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new ConfirmAppointmentUseCase(appointmentRepository);
  });

  it("should confirm an appointment in HOLD", async () => {
    const appointment = makeAppointment();

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
      now: new Date("2026-03-10T12:05:00.000Z"),
    });

    expect(response.isRight()).toBe(true);
    expect(appointment.status.value).toBe("CONFIRMED");
    expect(appointment.holdExpiresAt).toBeUndefined();
  });

  it("should expire hold when trying to confirm after expiration", async () => {
    const appointment = makeAppointment({
      holdExpiresAt: new Date("2026-03-10T12:05:00.000Z"),
    });

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
      now: new Date("2026-03-10T12:06:00.000Z"),
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(HoldExpiredError);
    expect(appointment.status.value).toBe("EXPIRED");
  });

  it("should return error when appointment is not in HOLD", async () => {
    const appointment = makeAppointment({ status: "CANCELLED" });

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(InvalidAppointmentStateError);
  });
});
