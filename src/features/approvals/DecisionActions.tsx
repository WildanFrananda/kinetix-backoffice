import type { DecisionKind } from "../../types/decision_kind.type"
import { Button } from "../../ui/Button"
import { Check } from "../../ui/icons/Check"
import { X } from "../../ui/icons/X"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"

function DecisionActions({ canReject, onAsk }: { canReject: boolean; onAsk: (kind: DecisionKind) => void }) {
  const text = useApprovalsText()

  return (
    <div className={styles.actions}>
      <Button aria-keyshortcuts="A" onPress={() => onAsk("approve")}>
        <Check aria-hidden="true" />
        {text["approvals.approve"]}
        <span className={styles.actionKey} aria-hidden="true">
          A
        </span>
      </Button>
      {canReject ? (
        <Button variant="secondary" aria-keyshortcuts="R" onPress={() => onAsk("reject")}>
          <X aria-hidden="true" />
          {text["approvals.reject"]}
          <span className={styles.actionKey} aria-hidden="true">
            R
          </span>
        </Button>
      ) : null}
    </div>
  )
}

export { DecisionActions }
