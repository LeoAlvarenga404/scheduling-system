import type { SchedulingConflictType } from "../core/types/scheduling-conflict.types";

export class SchedulingConflictsError extends Error {
  constructor(readonly conflictType: SchedulingConflictType) {
    super(conflictType);
  }
}
