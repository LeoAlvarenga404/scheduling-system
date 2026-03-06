import { beforeEach, describe, expect, it } from "vitest";
import { RescheduleAppointmentUseCase } from "./reschedule-appointment.usecase";
import { SchedulingConflictsError } from "src/domain/errors/scheduling-conflicts.error";
import { AppointmentRescheduledEvent } from "src/domain/events/appointment-rescheduled.event";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";
import { InMemoryDomainEventPublisher } from "src/test/publishers/in-memory-domain-event.publisher";

let sut: RescheduleAppointmentUseCase;
let appointmentRepository: InMemoryAppointmentRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe("Reschedule Appointment Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new RescheduleAppointmentUseCase(appointmentRepository, eventPublisher);
  });

  it("should reschedule and reset status to HOLD", async () => {
    const appointment = makeAppointment({ status: "CONFIRMED" });

    await appointmentRepository.save(appointment);

    const response = await sut.execute({
      appointmentId: appointment.id,
      tenantId: "tenant-01",
      newRoomId: "room-202",
      newStartAt: new Date("2026-03-10T15:00:00.000Z"),
      newEndAt: new Date("2026-03-10T15:45:00.000Z"),
      newResponsibleProfessionalId: "prof-12",
      newParticipantProfessionalIds: ["prof-13", "prof-13", "prof-12"],
      newHoldTtlSeconds: 300,
      now: new Date("2026-03-10T14:00:00.000Z"),
    });

    expect(response.isRight()).toBe(true);
    expect(appointment.status).toBe("HOLD");
    expect(appointment.roomId).toBe("room-202");
    expect(appointment.participantProfessionalIds).toEqual(["prof-13"]);
    expect(appointment.holdExpiresAt).toEqual(
      new Date("2026-03-10T14:05:00.000Z"),
    );
    expect(eventPublisher.publishedEvents).toHaveLength(1);
    expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(
      AppointmentRescheduledEvent,
    );
  });

  it("should block rescheduling when there is a professional conflict", async () => {
    const existingAppointment = makeAppointment({
      roomId: "room-101",
      responsibleProfessionalId: "prof-99",
      startAt: new Date("2026-03-10T15:00:00.000Z"),
      endAt: new Date("2026-03-10T15:45:00.000Z"),
    });

    const appointmentToReschedule = makeAppointment({
      roomId: "room-202",
      responsibleProfessionalId: "prof-12",
      status: "CONFIRMED",
    });

    await appointmentRepository.save(existingAppointment);
    await appointmentRepository.save(appointmentToReschedule);

    const response = await sut.execute({
      appointmentId: appointmentToReschedule.id,
      tenantId: "tenant-01",
      newRoomId: "room-303",
      newStartAt: new Date("2026-03-10T15:00:00.000Z"),
      newEndAt: new Date("2026-03-10T15:45:00.000Z"),
      newResponsibleProfessionalId: "prof-12",
      newParticipantProfessionalIds: ["prof-99"],
      now: new Date("2026-03-10T14:00:00.000Z"),
    });

    expect(response.isRight()).toBe(false);

    if (response.isLeft() && response.value instanceof SchedulingConflictsError) {
      expect(response.value.conflictType).toBe("CONFLICT_PROFESSIONAL");
    }

    expect(eventPublisher.publishedEvents).toHaveLength(0);
  });
});
