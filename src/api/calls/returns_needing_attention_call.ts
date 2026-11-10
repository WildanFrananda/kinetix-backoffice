import type { AttentionReturn } from "../../types/attention_return.type"
import type { BffCall } from "../../types/bff_call.type"
import { queuePageSize } from "../queue_page"
import { returnListSchema } from "../schemas/order_schemas"

const returnsNeedingAttentionCall: BffCall<AttentionReturn[]> = {
  endpoint: "order.listReturnsNeedingAttention",
  method: "GET",
  path: "/bff/api/v1/orders/returns/needs-attention",
  query: { limit: String(queuePageSize) },
  schema: returnListSchema
}

export { returnsNeedingAttentionCall }
