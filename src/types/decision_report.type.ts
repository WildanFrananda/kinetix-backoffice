import type { DecisionOutcome } from "./decision_outcome.type"

type DecisionReport = {
  id: number
  outcome: DecisionOutcome
  name: string
  unplaced: boolean
}

export type { DecisionReport }
