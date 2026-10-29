import { m } from "motion/react"
import { formatText } from "../../i18n/format_text"
import type { ApprovalQueue } from "../../types/approval_queue.type"
import type { DecisionReport } from "../../types/decision_report.type"
import { enter } from "../../ui/motion/motion_presets"
import { Notice } from "../../ui/Notice"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"

function DecisionNotice({ queue, report }: { queue: ApprovalQueue; report: DecisionReport | null }) {
  const text = useApprovalsText()

  if (report === null) {
    return null
  }

  const done =
    report.outcome === "rejected"
      ? text["approvals.done.rejectedSeller"]
      : text[queue === "sellers" ? "approvals.done.approvedSeller" : "approvals.done.approvedCourier"]

  return (
    <m.div
      key={`${report.outcome}-${report.id}`}
      className={styles.notice}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enter}
    >
      <Notice tone="info">
        {formatText(done, { name: report.name })}
        {report.unplaced ? <span className={styles.noticeNote}>{text["approvals.note.unplaced"]}</span> : null}
      </Notice>
    </m.div>
  )
}

export { DecisionNotice }
