import type { AttentionSaga } from "../../types/attention_saga.type"
import type { BffCall } from "../../types/bff_call.type"
import { queuePageSize } from "../queue_page"
import { sagaListSchema } from "../schemas/order_schemas"

const attentionSagasCall: BffCall<AttentionSaga[]> = {
  endpoint: "order.listSagasNeedingAttention",
  method: "GET",
  path: "/bff/api/v1/orders/sagas/needs-attention",
  query: { limit: String(queuePageSize) },
  schema: sagaListSchema
}

export { attentionSagasCall }
