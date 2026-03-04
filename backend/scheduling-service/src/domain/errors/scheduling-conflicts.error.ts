export type SchedulingConflictType = "CONFLICT_ROOM" | "CONFLICT_PROFESSIONAL";

export class SchedulingConflictsError extends Error {
  constructor(readonly conflictType: SchedulingConflictType) {
    super(conflictType);
  }
}
