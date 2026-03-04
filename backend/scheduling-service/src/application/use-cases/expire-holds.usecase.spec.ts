import { beforeEach, describe, expect, it } from "vitest";
import { ExpireHoldsUseCase } from "./expire-holds.usecase";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";

let sut: ExpireHoldsUseCase;
let appointmentRepository: InMemoryAppointmentRepository;

describe("Expire Holds Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    sut = new ExpireHoldsUseCase(appointmentRepository);
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

    await appointmentRepository.createAppointment(overdueHold);
    await appointmentRepository.createAppointment(activeHold);

    const response = await sut.execute({
      now: new Date("2026-03-10T12:10:00.000Z"),
    });

    expect(response.isRight()).toBe(true);

    if (response.isRight()) {
      expect(response.value.expiredAppointments).toHaveLength(1);
      expect(response.value.expiredAppointments[0].id.toString()).toBe(
        overdueHold.id.toString(),
      );
    }

    expect(overdueHold.status.value).toBe("EXPIRED");
    expect(activeHold.status.value).toBe("HOLD");
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

    await appointmentRepository.createAppointment(tenantOneHold);
    await appointmentRepository.createAppointment(tenantTwoHold);

    const response = await sut.execute({
      tenantId: "tenant-01",
      now: new Date("2026-03-10T12:10:00.000Z"),
    });

    expect(response.isRight()).toBe(true);
    expect(tenantOneHold.status.value).toBe("EXPIRED");
    expect(tenantTwoHold.status.value).toBe("HOLD");
  });
});
