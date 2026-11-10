type JobAction =
  | { kind: "assign"; courierId: number; distanceKm: number }
  | { kind: "unassign"; courierId: number }
  | { kind: "cancel" }

export type { JobAction }
