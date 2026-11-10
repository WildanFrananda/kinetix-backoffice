import type { BffCall } from "../../types/bff_call.type"
import type { OrderCompletion } from "../../types/order_completion.type"
import { completionSchema } from "../schemas/order_schemas"

function completeOrderCall(orderNumber: string): BffCall<OrderCompletion> {
  return {
    endpoint: "order.completeOrder",
    method: "POST",
    path: `/bff/api/v1/orders/${encodeURIComponent(orderNumber)}/complete`,
    schema: completionSchema
  }
}

export { completeOrderCall }
