type ApprovalsSearch = {
  status?: "pending" | "verified" | "approved" | "rejected" | undefined
  after?: number | undefined
  selected?: number | undefined
}

export type { ApprovalsSearch }
