import { beforeEach, describe, expect, it } from "vitest";
import { Appointment } from "src/domain/entities/appointment";
import { TenantMismatchError } from "src/domain/errors/tenant-mismatch.error";
import { AppointmentStatus } from "src/domain/value-objects/appointment-status.vo";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { RescheduleAppointmentUseCase } from "./reschedule-appointment.usecase";

let sut: RescheduleAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("Reschedule Appointment", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new RescheduleAppointmentUseCase(appointmentRepository);
  });

  it("should be able to reschedule an appointment", async () => {
    const startDate = new Date("2026-03-03T10:00:00.000Z");
    const endDate = new Date("2026-03-03T11:00:00.000Z");
    const newStartDate = new Date("2026-03-03T12:00:00.000Z");
    const newEndDate = new Date("2026-03-03T13:00:00.000Z");

    const appointment = Appointment.create({
      customerId: "customer-id",
      endDate,
      startDate,
      professionalId: "professional-id",
      status: AppointmentStatus.create("PENDING"),
      tenantId: "tenant-01",
    });

    await appointmentRepository.createAppointment(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id.toString(),
      tenantId: "tenant-01",
      newStartDate,
      newEndDate,
    });

    expect(response.isRight()).toBe(true);
    expect(appointmentRepository.items[0].startDate).toEqual(newStartDate);
    expect(appointmentRepository.items[0].endDate).toEqual(newEndDate);
  });

  it("should return error when appointment does not exist", async () => {
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
      newStartDate: new Date(),
      newEndDate: new Date(),
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(TenantMismatchError);
  });
});
