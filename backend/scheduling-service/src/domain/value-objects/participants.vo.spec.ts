import { describe, expect, it } from "vitest";

import { AppointmentValidationError } from "../errors/appointment-validation.error";
import { Participants } from "./participants.vo";
import { ProfessionalId } from "./professional-id.vo";

describe("Participants Value Object", () => {
  it("should contain a participant by professional id", () => {
    const participants = Participants.create([
      ProfessionalId.create("prof-10"),
      ProfessionalId.create("prof-20"),
    ]);

    expect(participants.contains(ProfessionalId.create("prof-10"))).toBe(true);
    expect(participants.contains(ProfessionalId.create("prof-99"))).toBe(false);
  });

  it("should throw when there are duplicate participants", () => {
    expect(() =>
      Participants.create([
        ProfessionalId.create("prof-10"),
        ProfessionalId.create("prof-10"),
      ]),
    ).toThrowError(AppointmentValidationError);
  });
});
