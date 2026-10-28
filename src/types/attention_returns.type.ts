import type { AttentionReturn } from "./attention_return.type"

type AttentionReturns = {
  count: number
  more: boolean
  latest: readonly AttentionReturn[]
}

export type { AttentionReturns }
