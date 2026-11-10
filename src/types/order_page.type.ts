import type { OrderSummary } from "./order_summary.type"

type OrderPage = {
  orders: readonly OrderSummary[]
  nextCursor: string | null
}

export type { OrderPage }
