import { ToggleButton, ToggleButtonGroup } from "react-aria-components"
import type { ApprovalsSearch } from "../../types/approvals_search.type"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"

type Status = NonNullable<ApprovalsSearch["status"]>

const labels = {
  pending: "approvals.status.pending",
  verified: "approvals.status.verified",
  approved: "approvals.status.approved",
  rejected: "approvals.status.rejected"
} as const satisfies Record<Status, string>

function StatusFilter({
  statuses,
  status,
  onChange
}: {
  statuses: readonly Status[]
  status: Status
  onChange: (next: Status) => void
}) {
  const text = useApprovalsText()

  return (
    <div>
      <p className={styles.label} id="approvals-status-label">
        {text["approvals.status.label"]}
      </p>
      <ToggleButtonGroup
        aria-labelledby="approvals-status-label"
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[status]}
        onSelectionChange={(keys) => {
          const [picked] = [...keys]
          const next = statuses.find((candidate) => candidate === picked)
          if (next !== undefined) {
            onChange(next)
          }
        }}
        className={styles.statuses}
      >
        {statuses.map((candidate) => (
          <ToggleButton key={candidate} id={candidate} className={styles.status}>
            {text[labels[candidate]]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  )
}

export { StatusFilter }
