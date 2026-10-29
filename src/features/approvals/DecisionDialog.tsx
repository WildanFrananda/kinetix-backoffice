import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components"
import type { DecisionKind } from "../../types/decision_kind.type"
import type { FailureExplanation } from "../../types/failure_explanation.type"
import { Button } from "../../ui/Button"
import { Check } from "../../ui/icons/Check"
import { X } from "../../ui/icons/X"
import { Notice } from "../../ui/Notice"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"

function DecisionDialog({
  open,
  kind,
  title,
  body,
  pending,
  failure,
  onConfirm,
  onClose
}: {
  open: boolean
  kind: DecisionKind
  title: string
  body: string
  pending: boolean
  failure: FailureExplanation | null
  onConfirm: () => void
  onClose: () => void
}) {
  const text = useApprovalsText()
  const approving = kind === "approve"

  return (
    <ModalOverlay
      isOpen={open}
      isDismissable={!pending}
      isKeyboardDismissDisabled={pending}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      className={styles.overlay}
    >
      <Modal className={styles.modal}>
        <Dialog role="alertdialog" className={styles.dialog} data-kind={kind}>
          <Heading slot="title" className={styles.dialogTitle}>
            {title}
          </Heading>
          <p className={styles.dialogBody}>{body}</p>
          {failure === null ? null : (
            <Notice tone="problem">
              {failure.lead}
              {failure.quote === null ? null : (
                <q className={styles.quote} lang="en">
                  {failure.quote}
                </q>
              )}
            </Notice>
          )}
          <div className={styles.dialogActions}>
            <Button
              variant={approving ? "primary" : "secondary"}
              isDisabled={pending}
              autoFocus={approving}
              onPress={onConfirm}
            >
              {approving ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
              {pending
                ? text[approving ? "approvals.approving" : "approvals.rejecting"]
                : text[approving ? "approvals.approve" : "approvals.reject"]}
            </Button>
            <Button
              variant={approving ? "secondary" : "primary"}
              isDisabled={pending}
              autoFocus={!approving}
              onPress={onClose}
            >
              {text["approvals.cancel"]}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { DecisionDialog }
