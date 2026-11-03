import type { PredicateMinimums } from "./predicate_minimums.type"
import type { PredicateRow } from "./predicate_row.type"

type Predicate = {
  id: string
  status: "live" | "withdrawn"
  class: string
  classId: string
  label: string
  minimums: PredicateMinimums
  freshnessDays: number
  approvedAt: string
  withdrawnAt: string | null
  rows: PredicateRow[]
}

export type { Predicate }
