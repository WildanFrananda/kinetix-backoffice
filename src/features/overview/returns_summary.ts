import { queuePageSize } from "../../api/queue_page"
import type { AttentionReturn } from "../../types/attention_return.type"
import type { AttentionReturns } from "../../types/attention_returns.type"

const shown = 5

function summarizeReturns(returns: readonly AttentionReturn[]): AttentionReturns {
  return {
    count: returns.length,
    more: returns.length >= queuePageSize,
    latest: [...returns].sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime()).slice(0, shown)
  }
}

export { summarizeReturns }
