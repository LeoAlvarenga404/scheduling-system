import { beforeEach, describe, expect, it } from "vitest";
import { CreateHoldAppointmentUseCase } from "./create-hold-appointment.usecase";
import { SchedulingConflictsError } from "src/domain/errors/scheduling-conflicts.error";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { InMemoryDomainEventPublisher } from "src/test/publishers/in-memory-domain-event.publisher";

let sut: CreateHoldAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe("Create Hold Appointment Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new CreateHoldAppointmentUseCase(appointmentRepository, eventPublisher);
  });

  it("should create a HOLD appointment", async () => {
    const response = await sut.execute({
      tenantId: "tenant-01",
      roomId: "room-101",
      serviceId: "srv-01",
      amount: 15000,
      startAt: new Date("2026-03-10T13:00:00.000Z"),
      endAt: new Date("2026-03-10T13:45:00.000Z"),
      responsibleProfessionalId: "prof-10",
      participantProfessionalIds: ["prof-99", "prof-99", "prof-10"],
      holdTtlSeconds: 600,
      now: new Date("2026-03-10T12:00:00.000Z"),
    });

    expect(response.isRight()).toBe(true);

    if (response.isRight()) {
      expect(response.value.appointment.status).toBe("HOLD");
      expect(response.value.appointment.participantProfessionalIds).toEqual([
        "prof-99",
      ]);
      expect(response.value.appointment.holdExpiresAt).toEqual(
        new Date("2026-03-10T12:10:00.000Z"),
      );
    }

    expect(appointmentRepository.items).toHaveLength(1);
    expect(eventPublisher.publishedEvents).toHaveLength(1);
  });

  it("should allow same slot in different rooms with different professionals (scenario A)", async () => {
    const first = await sut.execute({
      tenantId: "tenant-01",
      roomId: "room-101",
      serviceId: "srv-01",
      amount: 15000,
      startAt: new Date("2026-03-10T13:00:00.000Z"),
      endAt: new Date("2026-03-10T13:45:00.000Z"),
      responsibleProfessionalId: "prof-10",
      holdTtlSeconds: 600,
      now: new Date("2026-03-10T12:00:00.000Z"),
    });

    const second = await sut.execute({
      tenantId: "tenant-01",
      roomId: "room-102",
      serviceId: "srv-01",
      amount: 15000,
      startAt: new Date("2026-03-10T13:00:00.000Z"),
      endAt: new Date("2026-03-10T13:45:00.000Z"),
      responsibleProfessionalId: "prof-11",
      holdTtlSeconds: 600,
      now: new Date("2026-03-10T12:00:00.000Z"),
    });

    expect(first.isRight()).toBe(true);
    expect(second.isRight()).toBe(true);
    expect(appointmentRepository.items).toHaveLength(2);
  });

  it("should block same professional in another room at same time (scenario B)", async () => {
    await sut.execute({
      tenantId: "tenant-01",
      roomId: "room-101",
      serviceId: "srv-01",
      amount: 15000,
      startAt: new Date("2026-03-10T13:00:00.000Z"),
      endAt: new Date("2026-03-10T13:45:00.000Z"),
      responsibleProfessionalId: "prof-10",
      holdTtlSeconds: 600,
      now: new Date("2026-03-10T12:00:00.000Z"),
    });

    const response = await sut.execute({
      tenantId: "tenant-01",
      roomId: "room-102",
      serviceId: "srv-01",
      amount: 15000,
      startAt: new Date("2026-03-10T13:00:00.000Z"),
      endAt: new Date("2026-03-10T13:45:00.000Z"),
      responsibleProfessionalId: "prof-10",
      holdTtlSeconds: 600,
      now: new Date("2026-03-10T12:00:00.000Z"),
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(SchedulingConflictsError);
  });

  it("should block participant professional conflicts (scenario C)", async () => {
    await sut.execute({
      tenantId: "tenant-01",
      roomId: "room-101",
      serviceId: "srv-01",
      amount: 15000,
      startAt: new Date("2026-03-10T13:00:00.000Z"),
      endAt: new Date("2026-03-10T13:45:00.000Z"),
      responsibleProfessionalId: "prof-10",
      participantProfessionalIds: ["prof-99"],
      holdTtlSeconds: 600,
      now: new Date("2026-03-10T12:00:00.000Z"),
    });

    const response = await sut.execute({
      tenantId: "tenant-01",
      roomId: "room-103",
      serviceId: "srv-01",
      amount: 15000,
      startAt: new Date("2026-03-10T13:15:00.000Z"),
      endAt: new Date("2026-03-10T14:00:00.000Z"),
      responsibleProfessionalId: "prof-20",
      participantProfessionalIds: ["prof-99"],
      holdTtlSeconds: 600,
      now: new Date("2026-03-10T12:00:00.000Z"),
    });

    expect(response.isRight()).toBe(false);

    if (response.isLeft()) {
      expect(response.value).toBeInstanceOf(SchedulingConflictsError);
    }
  });
});
