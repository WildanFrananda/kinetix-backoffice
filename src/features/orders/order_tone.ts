import type { OrderStatus } from "../../types/order_status.type"

function orderTone(status: OrderStatus): "neutral" | "settled" {
  return status === "COMPLETED" ? "settled" : "neutral"
}

export { orderTone }
