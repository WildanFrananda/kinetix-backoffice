import type { LedgerEntry } from "./ledger_entry.type"

type LedgerPage = {
  entries: LedgerEntry[]
  nextBeforeId: number | null
}

export type { LedgerPage }
