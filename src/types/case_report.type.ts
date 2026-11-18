type CaseReport = {
  nullifier: string
  category: {
    slug: string
    label: string
  }
  body: string
  window: number
  status: "submitted" | "confirmed"
  firstGeneration: number
  txId: string | null
  submittedAt: string
  confirmedAt: string | null
}

export type { CaseReport }
