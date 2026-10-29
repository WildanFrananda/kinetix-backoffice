import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type FormEvent, useState } from "react"
import { Dialog, Heading, Label, Modal, ModalOverlay, Radio, RadioGroup } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { stockMovementCall } from "../../api/calls/stock_movement_call"
import { failureText } from "../../i18n/failure_text"
import { formatText } from "../../i18n/format_text"
import type { AdjustmentReason } from "../../types/adjustment_reason.type"
import type { StockMovementRequest } from "../../types/stock_movement_request.type"
import type { StockReport } from "../../types/stock_report.type"
import type { StockRow } from "../../types/stock_row.type"
import { Button } from "../../ui/Button"
import { Notice } from "../../ui/Notice"
import { TextField } from "../../ui/TextField"
import { movementFailure } from "./movement_failure"
import styles from "./Stock.module.css"
import { shortPrincipal } from "./short_principal"
import { productQuery, stockKey } from "./stock_queries"
import { useStockText } from "./stock_text"
import { wholeNumber } from "./whole_number"

const reasons = [
  "DAMAGE",
  "SHRINKAGE",
  "MISCOUNT",
  "RETURN_TO_SUPPLIER",
  "EXPIRY"
] as const satisfies readonly AdjustmentReason[]

const noteLimit = 1000

const skuLimit = 128

function freshKey(): string {
  return crypto.randomUUID()
}

function isKeyConflict(error: unknown): boolean {
  return (
    error instanceof BffError && error.failure.kind === "refused" && error.failure.code === "IDEMPOTENCY_KEY_CONFLICT"
  )
}

function MovementDialog({
  binCode,
  row,
  onClose,
  onDone
}: {
  binCode: string
  row: StockRow | null
  onClose: () => void
  onDone: (report: StockReport) => void
}) {
  const text = useStockText()
  const queryClient = useQueryClient()
  const receiving = row === null
  const [key, setKey] = useState(freshKey)
  const [sku, setSku] = useState("")
  const [lookedUp, setLookedUp] = useState("")
  const [quantity, setQuantity] = useState("")
  const [direction, setDirection] = useState<"remove" | "add">("remove")
  const [reason, setReason] = useState<AdjustmentReason>("DAMAGE")
  const [note, setNote] = useState("")
  const [problems, setProblems] = useState<Readonly<Record<string, string>>>({})
  const product = useQuery(productQuery(lookedUp))

  const movement = useMutation({
    mutationFn: (request: StockMovementRequest) => bffFetch(stockMovementCall(request)),
    onSuccess: (answer, request) => {
      void queryClient.invalidateQueries({ queryKey: stockKey })

      if (request.kind === "receipt") {
        onDone({
          kind: answer.replayed ? "replayed" : "received",
          bin: answer.binCode,
          sku: answer.sku,
          quantity: request.quantity,
          onHand: answer.onHand
        })

        return
      }

      onDone({ kind: "adjusted", bin: answer.binCode, sku: answer.sku, onHand: answer.onHand })
    },
    onError: (error) => {
      if (isKeyConflict(error)) {
        setKey(freshKey())
      }

      if (error instanceof BffError && error.failure.kind === "refused") {
        void queryClient.invalidateQueries({ queryKey: stockKey })
      }
    }
  })

  const owner = receiving ? (product.data?.merchantPrincipalId ?? null) : row.merchantPrincipalId
  const productSku = receiving ? (product.data?.sku ?? null) : row.sku

  function checked(): Record<string, string> {
    const found: Record<string, string> = {}
    const amount = wholeNumber(quantity)

    if (amount === null || amount < 1) {
      found.quantity = text[receiving ? "stock.rule.quantity" : "stock.rule.amount"]
    } else if (!receiving && direction === "remove" && amount > row.available) {
      found.quantity = formatText(text["stock.rule.removal"], { free: String(row.available) })
    }

    if ([...note].length > noteLimit) {
      found.note = text["stock.rule.note"]
    }

    return found
  }

  function lookUp(): void {
    const wanted = sku.trim()
    if (wanted.length === 0 || [...wanted].length > skuLimit) {
      setProblems({ sku: text["stock.rule.sku"] })
      return
    }

    setProblems({})
    setLookedUp(wanted)
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (receiving && lookedUp !== sku.trim()) {
      lookUp()
      return
    }

    const found = checked()
    setProblems(found)

    const amount = wholeNumber(quantity)
    if (Object.keys(found).length > 0 || amount === null || owner === null || productSku === null) {
      return
    }

    const request: StockMovementRequest = receiving
      ? {
          kind: "receipt",
          binCode,
          sku: productSku,
          merchantPrincipalId: owner,
          quantity: amount,
          note,
          idempotencyKey: key
        }
      : {
          kind: "adjustment",
          binCode,
          sku: productSku,
          merchantPrincipalId: owner,
          delta: direction === "remove" ? -amount : amount,
          reason,
          note,
          idempotencyKey: key
        }

    movement.mutate(request)
  }

  const failure =
    movement.error instanceof BffError
      ? movementFailure(movement.error.failure, text, receiving ? "receipt" : "adjustment")
      : null

  function productLine() {
    if (!receiving || lookedUp.length === 0) {
      return null
    }

    if (product.isPending) {
      return <p className={styles.formNote}>{text["stock.receive.lookingUp"]}</p>
    }

    if (product.isError) {
      return (
        <Notice tone="problem">
          {product.error instanceof BffError ? failureText(product.error.failure, text) : text["stock.failure.refused"]}
        </Notice>
      )
    }

    if (product.data === null) {
      return <Notice tone="problem">{text["stock.receive.notOnSale"]}</Notice>
    }

    if (product.data.merchantPrincipalId === null) {
      return <Notice tone="problem">{text["stock.receive.noMerchant"]}</Notice>
    }

    return (
      <p className={styles.product}>
        {formatText(text["stock.receive.product"], {
          title: product.data.title,
          merchant: shortPrincipal(product.data.merchantPrincipalId)
        })}
      </p>
    )
  }

  const ready = receiving ? owner !== null && lookedUp === sku.trim() : row.merchantPrincipalId !== null

  return (
    <ModalOverlay
      isOpen
      isDismissable={!movement.isPending}
      isKeyboardDismissDisabled={movement.isPending}
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
            {receiving
              ? formatText(text["stock.receive.title"], { bin: binCode })
              : formatText(text["stock.adjust.title"], { sku: row.sku, bin: binCode })}
          </Heading>
          <p className={styles.dialogBody}>
            {receiving
              ? text["stock.receive.body"]
              : formatText(text["stock.adjust.body"], {
                  onHand: String(row.quantity),
                  reserved: String(row.reserved),
                  free: String(row.available)
                })}
          </p>
          {!receiving && row.merchantPrincipalId === null ? (
            <Notice tone="problem">{text["stock.adjust.noOwner"]}</Notice>
          ) : null}
          <form noValidate className={styles.form} onSubmit={submit}>
            {receiving ? (
              <div className={styles.lookUp}>
                <TextField
                  label={text["stock.receive.sku"]}
                  value={sku}
                  onChange={(value) => setSku(value)}
                  onBlur={() => {
                    if (sku.trim().length > 0) {
                      lookUp()
                    }
                  }}
                  error={problems.sku ?? null}
                  validationBehavior="aria"
                  autoComplete="off"
                  mono
                  isRequired
                />
                <Button variant="secondary" onPress={lookUp} isDisabled={product.isFetching}>
                  {product.isFetching ? text["stock.receive.lookingUp"] : text["stock.receive.lookUp"]}
                </Button>
              </div>
            ) : (
              <>
                <RadioGroup
                  value={direction}
                  onChange={(value) => setDirection(value === "add" ? "add" : "remove")}
                  className={styles.choices}
                  orientation="horizontal"
                >
                  <Label className={styles.choiceLabel}>{text["stock.adjust.direction"]}</Label>
                  <div className={styles.segments}>
                    <Radio value="remove" className={styles.segment}>
                      {text["stock.adjust.remove"]}
                    </Radio>
                    <Radio value="add" className={styles.segment}>
                      {text["stock.adjust.add"]}
                    </Radio>
                  </div>
                </RadioGroup>
                <RadioGroup
                  value={reason}
                  onChange={(value) => setReason(reasons.find((candidate) => candidate === value) ?? "DAMAGE")}
                  className={styles.choices}
                >
                  <Label className={styles.choiceLabel}>{text["stock.adjust.reason"]}</Label>
                  <div className={styles.reasons}>
                    {reasons.map((candidate) => (
                      <Radio key={candidate} value={candidate} className={styles.reason}>
                        {text[`stock.reason.${candidate}`]}
                      </Radio>
                    ))}
                  </div>
                </RadioGroup>
              </>
            )}
            {productLine()}
            <TextField
              label={text[receiving ? "stock.receive.quantity" : "stock.adjust.amount"]}
              value={quantity}
              onChange={setQuantity}
              inputMode="numeric"
              error={problems.quantity ?? null}
              validationBehavior="aria"
              autoComplete="off"
              isRequired
            />
            <TextField
              label={text["stock.receive.note"]}
              description={text["stock.receive.noteHint"]}
              value={note}
              onChange={setNote}
              error={problems.note ?? null}
              validationBehavior="aria"
              autoComplete="off"
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
              <Button type="submit" isDisabled={movement.isPending || !ready}>
                {movement.isPending
                  ? text[receiving ? "stock.receive.submitting" : "stock.adjust.submitting"]
                  : text[receiving ? "stock.receive.submit" : "stock.adjust.submit"]}
              </Button>
              <Button variant="secondary" isDisabled={movement.isPending} onPress={onClose}>
                {text["stock.cancel"]}
              </Button>
            </div>
          </form>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { MovementDialog }
