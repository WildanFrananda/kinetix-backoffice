import { useQueries, useQueryClient } from "@tanstack/react-query"
import type { ApprovalQueue } from "../../types/approval_queue.type"
import type { DecisionOutcome } from "../../types/decision_outcome.type"
import type { DecisionPeriod } from "../../types/decision_period.type"
import type { DecisionTally } from "../../types/decision_tally.type"
import type { PeriodTally } from "../../types/period_tally.type"
import { useNow } from "../../ui/use_now"
import { tallyKey, tallyQuery } from "./approvals_queries"
import { periodStarts } from "./period_starts"

const periods = ["day", "week", "month"] as const satisfies readonly DecisionPeriod[]

function useDecisionTallies(queue: ApprovalQueue, options: { poll: boolean; enabled: boolean }) {
  const queryClient = useQueryClient()
  const now = useNow(options.enabled, 60_000)
  const starts = periodStarts(new Date(now))
  const answers = useQueries({ queries: periods.map((period) => tallyQuery(queue, starts[period], options)) })

  const rows: PeriodTally[] = periods.map((period, index) => ({
    period,
    since: starts[period],
    tally: answers[index]?.data
  }))

  function count(outcome: DecisionOutcome): void {
    queryClient.setQueriesData<DecisionTally>({ queryKey: [...tallyKey, queue] }, (tally) =>
      tally === undefined ? tally : { ...tally, [outcome]: tally[outcome] + 1 }
    )
  }

  return { rows, count }
}

export { useDecisionTallies }
