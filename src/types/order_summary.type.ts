import type { OrderStatus } from "./order_status.type"

type OrderSummary = {
  id: string
  orderNumber: string
  status: OrderStatus
  customerPrincipalId: string
  merchantPrincipalId: string
  finalTotal: number
  finalShippingFee: number
  itemCount: number
  createdAt: Date
  updatedAt: Date
  deliveredAt: Date | null
  completedAt: Date | null
}

export type { OrderSummary }
