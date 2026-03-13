import { beforeEach, describe, expect, it } from "vitest";
import { ConfirmAppointmentWhenPaidUseCase } from "./confirm-appointment-when-paid.usecase";
import { AlreadyConfirmedWithOtherPaymentError } from "src/domain/errors/already-confirmed-with-other-payment.error";
import { HoldExpiredError } from "src/domain/errors/hold-expired.error";
import { InMemoryAppointmentRepository } from "src/test/repositories/in-memory-appointment.repository";
import { makeAppointment } from "src/test/factories/make-appointment";
import { AppointmentConfirmedEvent } from "src/domain/events/appointment-confirmed.event";
import { InMemoryDomainEventPublisher } from "src/test/publishers/in-memory-domain-event.publisher";

let sut: ConfirmAppointmentWhenPaidUseCase;
let appointmentRepository: InMemoryAppointmentRepository;
let eventPublisher: InMemoryDomainEventPublisher;

describe("Confirm Appointment When Paid Use Case", () => {
  beforeEach(() => {
    appointmentRepository = new InMemoryAppointmentRepository();
    eventPublisher = new InMemoryDomainEventPublisher();
    sut = new ConfirmAppointmentWhenPaidUseCase(
      appointmentRepository,
      eventPublisher,
    );
  });

  it("should confirm payment within hold ttl (scenario D)", async () => {
    const appointment = makeAppointment({
      externalRef: "checkout_abc123",
      holdExpiresAt: new Date("2026-03-10T12:10:00.000Z"),
    });

    await appointmentRepository.save(appointment);

    const response = await sut.execute({
      tenantId: "tenant-01",
      externalRef: "checkout_abc123",
      paymentRef: "pay_777",
      paidAt: new Date("2026-03-10T12:05:10.000Z"),
      now: new Date("2026-03-10T12:05:10.000Z"),
    });

    expect(response.isRight()).toBe(true);
    expect(appointment.status).toBe("CONFIRMED");
    expect(appointment.paymentRef).toBe("pay_777");
    expect(eventPublisher.publishedEvents).toHaveLength(1);
    expect(eventPublisher.publishedEvents[0]).toBeInstanceOf(
      AppointmentConfirmedEvent,
    );
  });

  it("should return HOLD_EXPIRED when paid after hold expiration (scenario E)", async () => {
    const appointment = makeAppointment({
      externalRef: "checkout_expired",
      holdExpiresAt: new Date("2026-03-10T12:10:00.000Z"),
    });

    await appointmentRepository.save(appointment);

    const response = await sut.execute({
      tenantId: "tenant-01",
      externalRef: "checkout_expired",
      paymentRef: "pay_888",
      paidAt: new Date("2026-03-10T12:12:00.000Z"),
      now: new Date("2026-03-10T12:12:00.000Z"),
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(HoldExpiredError);
    expect(appointment.status).toBe("EXPIRED");
    expect(eventPublisher.publishedEvents).toHaveLength(1);
  });

  it("should return the existing appointment when it is already confirmed with the same payment", async () => {
    const appointment = makeAppointment({
      externalRef: "checkout_same_key",
      holdExpiresAt: new Date("2026-03-10T12:10:00.000Z"),
    });

    await appointmentRepository.save(appointment);

    const first = await sut.execute({
      tenantId: "tenant-01",
      externalRef: "checkout_same_key",
      paymentRef: "pay_999",
      paidAt: new Date("2026-03-10T12:04:00.000Z"),
      now: new Date("2026-03-10T12:04:00.000Z"),
    });

    const second = await sut.execute({
      tenantId: "tenant-01",
      externalRef: "checkout_same_key",
      paymentRef: "pay_999",
      paidAt: new Date("2026-03-10T12:20:00.000Z"),
      now: new Date("2026-03-10T12:20:00.000Z"),
    });

    expect(first.isRight()).toBe(true);
    expect(second.isRight()).toBe(true);

    if (first.isRight() && second.isRight()) {
      expect(second.value.appointment.paymentRef).toBe("pay_999");
      expect(second.value.appointment.id).toBe(first.value.appointment.id);
    }

    expect(eventPublisher.publishedEvents).toHaveLength(1);
  });

  it("should block confirmation with a different payment when already confirmed", async () => {
    const appointment = makeAppointment({
      status: "CONFIRMED",
      paymentRef: "pay_original",
      paidAt: new Date("2026-03-10T12:00:00.000Z"),
      externalRef: "checkout_other_payment",
    });

    await appointmentRepository.save(appointment);

    const response = await sut.execute({
      tenantId: "tenant-01",
      externalRef: "checkout_other_payment",
      paymentRef: "pay_another",
      paidAt: new Date("2026-03-10T12:30:00.000Z"),
      now: new Date("2026-03-10T12:30:00.000Z"),
    });

    expect(response.isRight()).toBe(false);
    expect(response.value).toBeInstanceOf(
      AlreadyConfirmedWithOtherPaymentError,
    );
    expect(eventPublisher.publishedEvents).toHaveLength(0);
  });
});
