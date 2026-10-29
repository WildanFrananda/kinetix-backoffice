import type { AdjustmentReason } from "./adjustment_reason.type"

type StockMovementRequest =
  | {
      kind: "receipt"
      binCode: string
      sku: string
      merchantPrincipalId: string
      quantity: number
      note: string
      idempotencyKey: string
    }
  | {
      kind: "adjustment"
      binCode: string
      sku: string
      merchantPrincipalId: string
      delta: number
      reason: AdjustmentReason
      note: string
      idempotencyKey: string
    }

export type { StockMovementRequest }
