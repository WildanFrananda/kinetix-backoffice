type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING_FULFILLMENT"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"

export type { OrderStatus }
