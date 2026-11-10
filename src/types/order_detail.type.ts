import type { OrderLine } from "./order_line.type"
import type { OrderStatus } from "./order_status.type"

type OrderDetail = {
  id: string
  orderNumber: string
  customerPrincipalId: string
  merchantPrincipalId: string
  driverPrincipalId: string | null
  status: OrderStatus
  subtotal: number
  discountAmount: number
  appliedVoucher: string | null
  finalTotal: number
  shippingAddress: string
  shippingServiceTier: string
  baseShippingFee: number
  shippingDiscount: number
  finalShippingFee: number
  distanceKm: number
  shippingQuoteBasis: string
  createdAt: Date
  items: readonly OrderLine[]
}

export type { OrderDetail }
