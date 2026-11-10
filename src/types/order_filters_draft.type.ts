import type { OrderStatus } from "./order_status.type"

type OrderFiltersDraft = {
  statuses: readonly OrderStatus[]
  from: string
  to: string
  merchant: string
  customer: string
  orderNumber: string
}

export type { OrderFiltersDraft }
