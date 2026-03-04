import { beforeEach, describe, expect, it } from "vitest";
import { Appointment } from "src/domain/entities/appointment";
import { TenantMismatchError } from "src/domain/errors/tenant-mismatch.error";
import { AppointmentStatus } from "src/domain/value-objects/appointment-status.vo";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { ConfirmAppointmentUseCase } from "./confirm-appointment.usecase";

let sut: ConfirmAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("Confirm Appointment", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new ConfirmAppointmentUseCase(appointmentRepository);
  });

  it("should be able to confirm an appointment", async () => {
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

    expect(response.isRight()).toBe(true);
    expect(appointmentRepository.items.length).toBe(1);
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
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(TenantMismatchError);
  });
});
