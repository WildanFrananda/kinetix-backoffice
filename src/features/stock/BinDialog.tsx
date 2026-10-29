import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type FormEvent, useState } from "react"
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { upsertBinCall } from "../../api/calls/upsert_bin_call"
import { formatText } from "../../i18n/format_text"
import type { BinDraft } from "../../types/bin_draft.type"
import type { StockReport } from "../../types/stock_report.type"
import { Button } from "../../ui/Button"
import { Notice } from "../../ui/Notice"
import { TextField } from "../../ui/TextField"
import { movementFailure } from "./movement_failure"
import styles from "./Stock.module.css"
import { stockKey } from "./stock_queries"
import { useStockText } from "./stock_text"
import { wholeNumber } from "./whole_number"

const textLimit = 64

function BinDialog({
  bin,
  onClose,
  onDone
}: {
  bin: BinDraft | null
  onClose: () => void
  onDone: (report: StockReport) => void
}) {
  const text = useStockText()
  const queryClient = useQueryClient()
  const [code, setCode] = useState(bin?.code ?? "")
  const [zone, setZone] = useState(bin?.zone ?? "")
  const [level, setLevel] = useState(bin === null ? "1" : String(bin.shelfLevel))
  const [problems, setProblems] = useState<Readonly<Record<string, string>>>({})

  const save = useMutation({
    mutationFn: (draft: BinDraft) => bffFetch(upsertBinCall(draft)),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: stockKey })
      onDone({ kind: "savedBin", bin: saved.code })
    }
  })

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    const found: Record<string, string> = {}
    const shelfLevel = wholeNumber(level)
    const trimmedZone = zone.trim()

    if (code.trim().length === 0 || [...code].length > textLimit) {
      found.code = text["stock.rule.code"]
    }

    if (trimmedZone.length === 0 || [...trimmedZone].length > textLimit) {
      found.zone = text["stock.rule.zone"]
    }

    if (shelfLevel === null) {
      found.level = text["stock.rule.level"]
    }

    setProblems(found)

    if (Object.keys(found).length === 0 && shelfLevel !== null) {
      save.mutate({ code: bin?.code ?? code.trim(), zone: trimmedZone, shelfLevel })
    }
  }

  const failure = save.error instanceof BffError ? movementFailure(save.error.failure, text, "adjustment") : null

  return (
    <ModalOverlay
      isOpen
      isDismissable={!save.isPending}
      isKeyboardDismissDisabled={save.isPending}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      className={styles.overlay}
    >
      <Modal className={styles.modal}>
        <Dialog className={styles.dialog}>
          <Heading slot="title" className={styles.dialogTitle}>
            {bin === null ? text["stock.bin.newTitle"] : formatText(text["stock.bin.editTitle"], { bin: bin.code })}
          </Heading>
          <form noValidate className={styles.form} onSubmit={submit}>
            {bin === null ? (
              <TextField
                label={text["stock.bin.code"]}
                description={text["stock.bin.codeHint"]}
                value={code}
                onChange={setCode}
                error={problems.code ?? null}
                validationBehavior="aria"
                autoComplete="off"
                mono
                isRequired
              />
            ) : null}
            <TextField
              label={text["stock.bin.zone"]}
              value={zone}
              onChange={setZone}
              error={problems.zone ?? null}
              validationBehavior="aria"
              autoComplete="off"
              isRequired
            />
            <TextField
              label={text["stock.bin.level"]}
              value={level}
              onChange={setLevel}
              inputMode="numeric"
              error={problems.level ?? null}
              validationBehavior="aria"
              autoComplete="off"
              isRequired
            />
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
              <Button type="submit" isDisabled={save.isPending}>
                {save.isPending ? text["stock.bin.submitting"] : text["stock.bin.submit"]}
              </Button>
              <Button variant="secondary" isDisabled={save.isPending} onPress={onClose}>
                {text["stock.cancel"]}
              </Button>
            </div>
          </form>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { BinDialog }
