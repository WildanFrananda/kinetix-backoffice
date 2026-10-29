import type { AdjustmentReason } from "./adjustment_reason.type"

type LedgerEntry =
  | {
      kind: "receipt"
      id: number
      binCode: string
      sku: string
      merchantPrincipalId: string | null
      delta: number
      note: string | null
      actorPrincipalId: string
      createdAt: Date
    }
  | {
      kind: "adjustment"
      id: number
      binCode: string
      sku: string
      merchantPrincipalId: string | null
      delta: number
      before: number
      after: number
      reason: AdjustmentReason
      note: string | null
      actorPrincipalId: string
      createdAt: Date
    }

export type { LedgerEntry }
