import type { OrderStatus } from "./order_status.type"

type OrderQuery = {
  statuses: readonly OrderStatus[]
  createdFrom: string | undefined
  createdTo: string | undefined
  merchant: string | undefined
  customer: string | undefined
  orderNumber: string | undefined
  before: string | undefined
}

export type { OrderQuery }
