import { beforeEach, describe, expect, it } from "vitest";
import { Appointment } from "src/domain/entities/appointment";
import { AppointmentStatus } from "src/domain/value-objects/appointment-status.vo";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { ListAppointmentByTenantIdUseCase } from "./list-appointment-by-tenant.usecase";

let sut: ListAppointmentByTenantIdUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("List Appointment By Tenant Id", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new ListAppointmentByTenantIdUseCase(appointmentRepository);
  });

  it("should be able to list appointments by tenant id", async () => {
    const appointmentOne = Appointment.create({
      customerId: "customer-id-1",
      endDate: new Date(),
      startDate: new Date(),
      professionalId: "professional-id-1",
      status: AppointmentStatus.create("PENDING"),
      tenantId: "tenant-01",
    });

    const appointmentTwo = Appointment.create({
      customerId: "customer-id-2",
      endDate: new Date(),
      startDate: new Date(),
      professionalId: "professional-id-2",
      status: AppointmentStatus.create("PENDING"),
      tenantId: "tenant-02",
    });

    await appointmentRepository.createAppointment(appointmentOne);
    await appointmentRepository.createAppointment(appointmentTwo);

    const response = await sut.execute({ tenantId: "tenant-01" });

    expect(response.isRight()).toBe(true);

    if (response.isRight()) {
      expect(response.value.appointments).toHaveLength(1);
      expect(response.value.appointments[0].tenantId).toBe("tenant-01");
    }
  });

  it("should return empty list when tenant has no appointments", async () => {
    const response = await sut.execute({ tenantId: "tenant-99" });

    expect(response.isRight()).toBe(true);

    if (response.isRight()) {
      expect(response.value.appointments).toHaveLength(0);
    }
  });
});
