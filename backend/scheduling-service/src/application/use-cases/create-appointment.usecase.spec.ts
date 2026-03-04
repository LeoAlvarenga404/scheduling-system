import { beforeEach, describe, expect, it } from "vitest";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentStatus } from "src/domain/value-objects/appointment-status.vo";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { CreateAppointmentUseCase } from "./create-appointment.usecase";

let sut: CreateAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("Create Appointment", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new CreateAppointmentUseCase(appointmentRepository);
  });

  it("should be able to create an appointment", async () => {
    const appointment = Appointment.create({
      customerId: "customer-id",
      endDate: new Date(),
      startDate: new Date(),
      professionalId: "professional-id",
      status: AppointmentStatus.create("PENDING"),
      tenantId: "tenant-01",
    });

    const response = await sut.execute(appointment);

    expect(response.isRight()).toBe(true);
    expect(appointmentRepository.items.length).toBe(1);
    expect(appointmentRepository.items[0].tenantId).toBe("tenant-01");
  });
});
