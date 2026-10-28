import * as v from "valibot"
import type { AttentionReturns } from "../../types/attention_returns.type"
import type { BffCall } from "../../types/bff_call.type"
import { queuePageSize } from "../queue_page"
import { instantSchema } from "../schemas/instant_schema"

const shown = 5

const returnsSchema = v.pipe(
  v.array(
    v.object({
      returnNumber: v.string(),
      orderNumber: v.string(),
      status: v.string(),
      reason: v.string(),
      openedAt: instantSchema,
      lastRefundError: v.nullable(v.string())
    })
  ),
  v.transform(
    (returns): AttentionReturns => ({
      count: returns.length,
      more: returns.length >= queuePageSize,
      latest: [...returns].sort((a, b) => b.openedAt.getTime() - a.openedAt.getTime()).slice(0, shown)
    })
  )
)

const returnsNeedingAttentionCall: BffCall<AttentionReturns> = {
  endpoint: "order.listReturnsNeedingAttention",
  method: "GET",
  path: "/bff/api/v1/orders/returns/needs-attention",
  query: { limit: String(queuePageSize) },
  schema: returnsSchema
}

export { returnsNeedingAttentionCall }
