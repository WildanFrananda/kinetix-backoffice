import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components"
import { formatText } from "../../i18n/format_text"
import type { FailureExplanation } from "../../types/failure_explanation.type"
import { Button } from "../../ui/Button"
import { Trash } from "../../ui/icons/Trash"
import { Notice } from "../../ui/Notice"
import styles from "./Predicates.module.css"
import { usePredicatesText } from "./predicates_text"

function WithdrawPredicateDialog({
  open,
  label,
  pending,
  failure,
  onConfirm,
  onClose
}: {
  open: boolean
  label: string
  pending: boolean
  failure: FailureExplanation | null
  onConfirm: () => void
  onClose: () => void
}) {
  const text = usePredicatesText()

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
        <Dialog role="alertdialog" className={styles.dialog}>
          <Heading slot="title" className={styles.dialogTitle}>
            {formatText(text["predicates.withdraw.title"], { label })}
          </Heading>
          <p className={styles.dialogBody}>{text["predicates.withdraw.confirmBody"]}</p>
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
            <Button variant="secondary" isDisabled={pending} onPress={onConfirm}>
              <Trash aria-hidden="true" />
              {pending ? text["predicates.withdraw.withdrawing"] : text["predicates.withdraw.confirm"]}
            </Button>
            <Button variant="primary" isDisabled={pending} autoFocus onPress={onClose}>
              {text["predicates.cancel"]}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { WithdrawPredicateDialog }
