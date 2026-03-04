import { describe, expect, it } from "vitest";

import { AppointmentValidationError } from "../errors/appointment-validation.error";
import { TimeSlot } from "./time-slot.vo";

describe("TimeSlot Value Object", () => {
  it("should detect overlap and calculate duration", () => {
    const slot = TimeSlot.create(
      new Date("2026-03-10T13:00:00.000Z"),
      new Date("2026-03-10T13:45:00.000Z"),
    );
    const overlappingSlot = TimeSlot.create(
      new Date("2026-03-10T13:30:00.000Z"),
      new Date("2026-03-10T14:00:00.000Z"),
    );
    const nonOverlappingSlot = TimeSlot.create(
      new Date("2026-03-10T14:00:00.000Z"),
      new Date("2026-03-10T14:30:00.000Z"),
    );

    expect(slot.durationMinutes()).toBe(45);
    expect(slot.overlaps(overlappingSlot)).toBe(true);
    expect(slot.overlaps(nonOverlappingSlot)).toBe(false);
  });

  it("should throw when interval is invalid", () => {
    expect(() =>
      TimeSlot.create(
        new Date("2026-03-10T13:00:00.000Z"),
        new Date("2026-03-10T12:59:00.000Z"),
      ),
    ).toThrowError(AppointmentValidationError);
  });
});
