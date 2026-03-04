import { beforeEach, describe, expect, it } from "vitest";
import { GetAppointmentByIdUseCase } from "./get-appointment-by-id.usecase";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";

let sut: GetAppointmentByIdUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("Get Appointment By Id Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new GetAppointmentByIdUseCase(appointmentRepository);
  });

  it("should return appointment when found by tenant and id", async () => {
    const appointment = makeAppointment();

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
    });

    expect(response.isRight()).toBe(true);

    if (response.isRight()) {
      expect(response.value.appointment.id.toString()).toBe(
        appointment.id.toString(),
      );
    }
  });

  it("should return not found for another tenant", async () => {
    const appointment = makeAppointment();

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-02",
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(AppointmentNotFoundError);
  });
});
