import { beforeEach, describe, expect, it } from "vitest";
import { CompleteAppointmentUseCase } from "./complete-appointment.usecase";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";

let sut: CompleteAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("Complete Appointment Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new CompleteAppointmentUseCase(appointmentRepository);
  });

  it("should complete confirmed appointment", async () => {
    const appointment = makeAppointment({ status: "CONFIRMED" });

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
    });

    expect(response.isRight()).toBe(true);
    expect(appointment.status.value).toBe("COMPLETED");
  });

  it("should return error when appointment is not confirmed", async () => {
    const appointment = makeAppointment({ status: "HOLD" });

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(InvalidAppointmentStateError);
  });
});
