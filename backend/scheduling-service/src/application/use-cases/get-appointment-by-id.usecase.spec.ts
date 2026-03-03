import { AppointmentRepository } from "src/domain/repositories/appointment.repository";
import { GetAppointmentByIdUseCase } from "./get-appointment-by-id.usecase";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentStatus } from "src/domain/value-objects/appointment-status.vo";
import { AppointmentNotFoundError } from "src/domain/errors/appointment-not-found.error";

let sut: GetAppointmentByIdUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("Get Appointment By Id", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new GetAppointmentByIdUseCase(appointmentRepository);
  });

  it("should be able to get an appointment by id", async () => {
    const appointment = Appointment.create({
      customerId: "customer-id",
      endDate: new Date(),
      startDate: new Date(),
      professionalId: "professional-id",
      status: AppointmentStatus.create("PENDING"),
      tenantId: "tenant-01",
    });

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
    });

    if (response.isRight()) {
      expect(response.value.appointment).toBeInstanceOf(Appointment);
    }

    expect(appointmentRepository.items[0].professionalId).toBe(
      "professional-id",
    );
    expect(appointmentRepository.items.length).toBe(1);
  });

  it("should return empty if not exists appointment", async () => {
    const appointment = Appointment.create({
      customerId: "customer-id",
      endDate: new Date(),
      startDate: new Date(),
      professionalId: "professional-id",
      status: AppointmentStatus.create("PENDING"),
      tenantId: "tenant-01",
    });

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "other-tenant",
    });

    expect(response.isRight()).toBe(false);

    expect(response.value).toBeInstanceOf(AppointmentNotFoundError);
    expect(appointmentRepository.items.length).toBe(1);
  });
});
