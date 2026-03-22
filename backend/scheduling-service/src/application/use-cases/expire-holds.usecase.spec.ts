import { beforeEach, describe, expect, it } from "vitest";
import { ExpireHoldsUseCase } from "./expire-holds.usecase";
import { AppointmentExpiredEvent } from "src/domain/events/appointment-expired.event";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";
import { InMemoryDomainEventPublisher } from "src/test/publishers/in-memory-domain-event.publisher";
import { vi } from "vitest";

let sut: ExpireHoldsUseCase;
let appointmentRepository: InMemoryAppointmentRepository;
let eventPublisher: InMemoryDomainEventPublisher;
let redisService: any;

describe("Expire Holds Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    redisService = {
      acquireLock: vi.fn().mockResolvedValue(true),
      releaseLock: vi.fn().mockResolvedValue(undefined),
    };
    sut = new ExpireHoldsUseCase(appointmentRepository, redisService, eventPublisher);
  });

  it("should expire overdue holds", async () => {
    const overdueHold = makeAppointment({
      holdExpiresAt: new Date("2026-03-10T12:00:00.000Z"),
    });

    const activeHold = makeAppointment({
      roomId: "room-202",
      responsibleProfessionalId: "prof-20",
      holdExpiresAt: new Date("2026-03-10T12:20:00.000Z"),
    });

    await appointmentRepository.save(overdueHold);
    await appointmentRepository.save(activeHold);

    const response = await sut.execute({
      now: new Date("2026-03-10T12:10:00.000Z"),
    });

    expect(response.isRight()).toBe(true);

    if (response.isRight()) {
      expect(response.value.expiredAppointments).toHaveLength(1);
      expect(response.value.expiredAppointments[0].id).toBe(overdueHold.id);
    }

    expect(overdueHold.status).toBe("EXPIRED");
    expect(activeHold.status).toBe("HOLD");
    expect(eventPublisher.publishedEvents).toHaveLength(1);
    expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(
      AppointmentExpiredEvent,
    );
  });

  it("should support tenant scoped expiration", async () => {
    const tenantOneHold = makeAppointment({
      tenantId: "tenant-01",
      holdExpiresAt: new Date("2026-03-10T12:00:00.000Z"),
    });

    const tenantTwoHold = makeAppointment({
      tenantId: "tenant-02",
      roomId: "room-202",
      responsibleProfessionalId: "prof-20",
      holdExpiresAt: new Date("2026-03-10T12:00:00.000Z"),
    });

    await appointmentRepository.save(tenantOneHold);
    await appointmentRepository.save(tenantTwoHold);

    const response = await sut.execute({
      tenantId: "tenant-01",
      now: new Date("2026-03-10T12:10:00.000Z"),
    });

    expect(response.isRight()).toBe(true);
    expect(tenantOneHold.status).toBe("EXPIRED");
    expect(tenantTwoHold.status).toBe("HOLD");
    expect(eventPublisher.publishedEvents).toHaveLength(1);
  });
});
