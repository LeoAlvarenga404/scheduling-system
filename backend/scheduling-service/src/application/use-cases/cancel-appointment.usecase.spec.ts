import { beforeEach, describe, expect, it } from "vitest";
import { CancelAppointmentUseCase } from "./cancel-appointment.usecase";
import { InvalidAppointmentStateError } from "src/domain/errors/invalid-appointment-state.error";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";

let sut: CancelAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("Cancel Appointment Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new CancelAppointmentUseCase(appointmentRepository);
  });

  it("should cancel appointment in HOLD or CONFIRMED", async () => {
    const appointment = makeAppointment({ status: "CONFIRMED" });

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
      reason: "customer request",
      cancelledBy: "user-01",
    });

    expect(response.isRight()).toBe(true);
    expect(appointment.status.value).toBe("CANCELLED");
    expect(appointment.metadata?.cancelledBy).toBe("user-01");
  });

  it("should return error when trying to cancel completed appointment", async () => {
    const appointment = makeAppointment({ status: "COMPLETED" });

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(InvalidAppointmentStateError);
  });
});
