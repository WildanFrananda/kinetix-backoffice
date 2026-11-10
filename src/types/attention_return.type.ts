import type { ReturnStatus } from "./return_status.type"

type AttentionReturn = {
  returnNumber: string
  orderNumber: string
  merchantPrincipalId: string
  status: ReturnStatus
  reason: string
  openedAt: Date
  goodsReceivedAt: Date | null
  refundAmount: number | null
  lastRefundError: string | null
}

export type { AttentionReturn }
