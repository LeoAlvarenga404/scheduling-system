import { beforeEach, describe, expect, it } from "vitest";
import { ListAppointmentsUseCase } from "./list-appointments.usecase";
import { AppointmentValidationError } from "src/domain/errors/appointment-validation.error";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";

let sut: ListAppointmentsUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("List Appointments Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new ListAppointmentsUseCase(appointmentRepository);
  });

  it("should list appointments by tenant with filters ordered by startAt", async () => {
    const appointmentOne = makeAppointment({
      tenantId: "tenant-01",
      roomId: "room-101",
      responsibleProfessionalId: "prof-10",
      participantProfessionalIds: ["prof-20"],
      status: "CONFIRMED",
      startAt: new Date("2026-03-10T13:00:00.000Z"),
      endAt: new Date("2026-03-10T13:45:00.000Z"),
    });

    const appointmentTwo = makeAppointment({
      tenantId: "tenant-01",
      roomId: "room-101",
      responsibleProfessionalId: "prof-10",
      participantProfessionalIds: ["prof-20"],
      status: "CONFIRMED",
      startAt: new Date("2026-03-10T15:00:00.000Z"),
      endAt: new Date("2026-03-10T15:45:00.000Z"),
    });

    const anotherTenantAppointment = makeAppointment({
      tenantId: "tenant-02",
      roomId: "room-101",
      responsibleProfessionalId: "prof-10",
      status: "CONFIRMED",
      startAt: new Date("2026-03-10T14:00:00.000Z"),
      endAt: new Date("2026-03-10T14:45:00.000Z"),
    });

    await appointmentRepository.createAppointment(appointmentTwo);
    await appointmentRepository.createAppointment(appointmentOne);
    await appointmentRepository.createAppointment(anotherTenantAppointment);

    const response = await sut.execute({
      tenantId: "tenant-01",
      dateFrom: new Date("2026-03-10T12:00:00.000Z"),
      dateTo: new Date("2026-03-10T16:00:00.000Z"),
      roomId: "room-101",
      responsibleProfessionalId: "prof-10",
      participantProfessionalId: "prof-20",
      status: "CONFIRMED",
    });

    expect(response.isRight()).toBe(true);

    if (response.isRight()) {
      expect(response.value.appointments).toHaveLength(2);
      expect(response.value.appointments[0].id.toString()).toBe(
        appointmentOne.id.toString(),
      );
      expect(response.value.appointments[1].id.toString()).toBe(
        appointmentTwo.id.toString(),
      );
    }
  });

  it("should return validation error when date range is invalid", async () => {
    const response = await sut.execute({
      tenantId: "tenant-01",
      dateFrom: new Date("2026-03-10T16:00:00.000Z"),
      dateTo: new Date("2026-03-10T15:00:00.000Z"),
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(AppointmentValidationError);
  });
});
