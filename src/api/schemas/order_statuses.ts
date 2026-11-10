const orderStatuses = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING_FULFILLMENT",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED"
] as const

export { orderStatuses }
