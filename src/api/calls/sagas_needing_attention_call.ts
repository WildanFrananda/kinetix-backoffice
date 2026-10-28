import type { BffCall } from "../../types/bff_call.type"
import { countSchema } from "../schemas/count_schema"

const sagasNeedingAttentionCall: BffCall<number> = {
  endpoint: "order.countSagasNeedingAttention",
  method: "GET",
  path: "/bff/api/v1/orders/sagas/needs-attention/count",
  schema: countSchema
}

export { sagasNeedingAttentionCall }
