import type { BffCall } from "../../types/bff_call.type"
import type { OrderDetail } from "../../types/order_detail.type"
import { orderSchema } from "../schemas/order_schemas"

function orderCall(orderId: string): BffCall<OrderDetail> {
  return {
    endpoint: "order.getOrder",
    method: "GET",
    path: `/bff/api/v1/orders/${encodeURIComponent(orderId)}`,
    schema: orderSchema
  }
}

export { orderCall }
