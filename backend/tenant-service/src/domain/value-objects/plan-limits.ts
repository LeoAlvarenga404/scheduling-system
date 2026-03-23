export class PlanLimits {
  constructor(
    public readonly maxAppointmentsPerMonth: number | null,
    public readonly maxProfessionals: number | null,
    public readonly maxRooms: number | null,
    public readonly features: string[]
  ) {}

  exceedsAppointments(current: number): boolean {
    if (this.maxAppointmentsPerMonth === null) return false;
    return current > this.maxAppointmentsPerMonth;
  }

  exceedsProfessionals(current: number): boolean {
    if (this.maxProfessionals === null) return false;
    return current > this.maxProfessionals;
  }

  exceedsRooms(current: number): boolean {
    if (this.maxRooms === null) return false;
    return current > this.maxRooms;
  }

  hasFeature(feature: string): boolean {
    return this.features.includes(feature);
  }
}
