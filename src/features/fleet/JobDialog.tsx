import { useRef } from "react"
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components"
import { formatDistance } from "../../i18n/format_distance"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { FailureExplanation } from "../../types/failure_explanation.type"
import type { JobAction } from "../../types/job_action.type"
import { Button } from "../../ui/Button"
import { Notice } from "../../ui/Notice"
import styles from "./Fleet.module.css"
import { useFleetText } from "./fleet_text"

function JobDialog({
  jobId,
  action,
  working,
  problem,
  onConfirm,
  onClose
}: {
  jobId: number
  action: JobAction | null
  working: boolean
  problem: FailureExplanation | null
  onConfirm: () => void
  onClose: () => void
}) {
  const text = useFleetText()
  const locale = useLocale()
  const last = useRef<JobAction | null>(action)

  if (action !== null) {
    last.current = action
  }

  const shown = action ?? last.current
  const values = {
    job: String(jobId),
    courier: shown === null || shown.kind === "cancel" ? "" : String(shown.courierId),
    distance: shown?.kind === "assign" ? formatDistance(shown.distanceKm, locale) : ""
  }

  const kind = shown?.kind ?? "cancel"
  const confirmFirst = kind === "assign"

  return (
    <ModalOverlay
      isOpen={action !== null}
      isDismissable={!working}
      isKeyboardDismissDisabled={working}
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
            {formatText(text[`dispatch.confirm.${kind}.title`], values)}
          </Heading>
          <p className={styles.dialogBody}>{formatText(text[`dispatch.confirm.${kind}.body`], values)}</p>
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
            <Button
              variant={confirmFirst ? "primary" : "secondary"}
              isDisabled={working}
              autoFocus={confirmFirst}
              onPress={onConfirm}
            >
              {working ? text["dispatch.confirm.cancel.working"] : text[`dispatch.confirm.${kind}.confirm`]}
            </Button>
            <Button
              variant={confirmFirst ? "secondary" : "primary"}
              isDisabled={working}
              autoFocus={!confirmFirst}
              onPress={onClose}
            >
              {text["dispatch.confirm.back"]}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { JobDialog }
