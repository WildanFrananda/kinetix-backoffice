import type { ApprovalsSearch } from "../../types/approvals_search.type"

function statusTone(status: NonNullable<ApprovalsSearch["status"]>): "attention" | "settled" | "neutral" {
  if (status === "pending") {
    return "attention"
  }

  return status === "rejected" ? "neutral" : "settled"
}

const statusLabel = {
  pending: "approvals.status.pending",
  verified: "approvals.status.verified",
  approved: "approvals.status.approved",
  rejected: "approvals.status.rejected"
} as const satisfies Record<NonNullable<ApprovalsSearch["status"]>, string>

export { statusLabel, statusTone }
