import type { DecisionPeriod } from "./decision_period.type"
import type { DecisionTally } from "./decision_tally.type"

type PeriodTally = {
  period: DecisionPeriod
  since: Date
  tally: DecisionTally | undefined
}

export type { PeriodTally }
