import type { PredicateMinimums } from "./predicate_minimums.type"

type PredicateDraft = {
  label: string
  minimums: PredicateMinimums
  freshnessDays: number
}

export type { PredicateDraft }
