import type { ReactNode } from "react"
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components"
import type { FailureExplanation } from "../../types/failure_explanation.type"
import { Button } from "../../ui/Button"
import { Notice } from "../../ui/Notice"
import styles from "./Orders.module.css"

function ConfirmDialog({
  open,
  title,
  body,
  confirm,
  back,
  working,
  problem,
  children,
  onConfirm,
  onClose
}: {
  open: boolean
  title: string
  body: string
  confirm: string
  back: string
  working: boolean
  problem: FailureExplanation | null
  children?: ReactNode
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <ModalOverlay
      isOpen={open}
      isDismissable={!working}
      isKeyboardDismissDisabled={working}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
        }
      }}
      className={styles.overlay}
    >
      <Modal className={styles.modal}>
        <Dialog role="alertdialog" className={styles.dialog}>
          <form
            className={styles.dialogForm}
            onSubmit={(event) => {
              event.preventDefault()
              onConfirm()
            }}
          >
            <Heading slot="title" className={styles.dialogTitle}>
              {title}
            </Heading>
            <p className={styles.dialogBody}>{body}</p>
            {children}
            {problem === null ? null : (
              <Notice tone="problem">
                {problem.lead}
                {problem.quote === null ? null : (
                  <q className={styles.quote} lang="en">
                    {problem.quote}
                  </q>
                )}
              </Notice>
            )}
            <div className={styles.dialogActions}>
              <Button type="submit" variant="secondary" isDisabled={working}>
                {confirm}
              </Button>
              <Button variant="primary" isDisabled={working} autoFocus={children === undefined} onPress={onClose}>
                {back}
              </Button>
            </div>
          </form>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { ConfirmDialog }
