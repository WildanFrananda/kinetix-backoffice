import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { FieldError, Label, Text, TextArea, TextField } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { rejectReturnCall } from "../../api/calls/reject_return_call"
import { outcomeUnknown } from "../../api/outcome_unknown"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { AttentionReturn } from "../../types/attention_return.type"
import type { ReturnReport } from "../../types/return_report.type"
import { Button } from "../../ui/Button"
import { ArrowUUpLeft } from "../../ui/icons/ArrowUUpLeft"
import { XCircle } from "../../ui/icons/XCircle"
import { StatusTag } from "../../ui/StatusTag"
import { returnsKey } from "../overview/overview_queries"
import { ConfirmDialog } from "./ConfirmDialog"
import { rupiah } from "./money"
import styles from "./Orders.module.css"
import { decidedElsewhere, rejectionFailure } from "./order_failure"
import { useOrdersText } from "./orders_text"

const reasonLength = 500

function rejectable(item: AttentionReturn): boolean {
  return item.status === "OPEN" && item.goodsReceivedAt === null
}

function ReturnView({
  item,
  gone,
  rejectRequest,
  onRejected
}: {
  item: AttentionReturn
  gone: boolean
  rejectRequest: number
  onRejected: (report: ReturnReport) => void
}) {
  const text = useOrdersText()
  const locale = useLocale()
  const money = rupiah(locale)
  const exact = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })
  const queryClient = useQueryClient()
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState("")
  const [blank, setBlank] = useState(false)
  const [unknownBefore, setUnknownBefore] = useState(false)
  const handled = useRef(rejectRequest)
  const offered = rejectable(item) && !gone

  const reject = useMutation({
    mutationFn: (stated: string) => bffFetch(rejectReturnCall(item.returnNumber, stated)),
    onSuccess: () => {
      queryClient.setQueryData<AttentionReturn[]>(returnsKey, (current) =>
        current?.filter((candidate) => candidate.returnNumber !== item.returnNumber)
      )

      void queryClient.invalidateQueries({ queryKey: returnsKey })
      setAsking(false)
      onRejected({ returnNumber: item.returnNumber, orderNumber: item.orderNumber })
    },
    onError: (error) => {
      if (!(error instanceof BffError)) {
        return
      }

      if (outcomeUnknown(error.failure)) {
        setUnknownBefore(true)
        return
      }

      if (decidedElsewhere(error.failure)) {
        void queryClient.invalidateQueries({ queryKey: returnsKey })
      }
    }
  })

  const resetRejection = reject.reset

  function ask(): void {
    resetRejection()
    setBlank(false)
    setAsking(true)
  }

  useEffect(() => {
    if (rejectRequest === handled.current) {
      return
    }

    handled.current = rejectRequest

    if (offered) {
      resetRejection()
      setBlank(false)
      setAsking(true)
    }
  }, [rejectRequest, offered, resetRejection])

  function confirm(): void {
    const stated = reason.trim()
    if (stated.length === 0) {
      setBlank(true)
      return
    }

    reject.mutate(stated)
  }

  const problem = reject.error instanceof BffError ? rejectionFailure(reject.error.failure, text) : null
  const alreadyAfterRetry =
    unknownBefore &&
    reject.error instanceof BffError &&
    reject.error.failure.kind === "refused" &&
    reject.error.failure.code === "RETURN_ALREADY_REJECTED"

  return (
    <article className={styles.detail} aria-labelledby="return-title">
      <header className={styles.detailHead}>
        <p className={styles.kicker}>
          <ArrowUUpLeft aria-hidden="true" />
          {text["returns.detail.kicker"]}
        </p>
        <h2 id="return-title" className={styles.detailTitle}>
          <span>{item.returnNumber}</span>
          <StatusTag tone={item.status === "OPEN" ? "neutral" : "attention"}>
            {text[`returns.status.${item.status}`]}
          </StatusTag>
        </h2>
        <p className={styles.detailLead}>
          {gone
            ? text["returns.detail.goneLead"]
            : offered
              ? text["returns.detail.openLead"]
              : formatText(text["returns.detail.stuckLead"], {
                  amount: item.refundAmount === null ? "—" : money.format(item.refundAmount)
                })}
        </p>
      </header>
      <dl className={styles.facts}>
        <dt>{text["returns.detail.order"]}</dt>
        <dd>
          <Link to="/orders" search={{ orderNumber: item.orderNumber }} className={styles.inlineLink}>
            {item.orderNumber}
          </Link>
        </dd>
        <dt>{text["returns.detail.seller"]}</dt>
        <dd className={styles.mono}>{item.merchantPrincipalId}</dd>
        <dt>{text["returns.detail.reason"]}</dt>
        <dd>{item.reason}</dd>
        <dt>{text["returns.detail.opened"]}</dt>
        <dd>{exact.format(item.openedAt)}</dd>
        <dt>{text["returns.detail.goodsReceived"]}</dt>
        <dd>
          {item.goodsReceivedAt === null ? (
            <span className={styles.quiet}>{text["returns.detail.notReceived"]}</span>
          ) : (
            exact.format(item.goodsReceivedAt)
          )}
        </dd>
        <dt>{text["returns.detail.refund"]}</dt>
        <dd>
          {item.refundAmount === null ? (
            <span className={styles.quiet}>{text["returns.detail.noRefund"]}</span>
          ) : (
            money.format(item.refundAmount)
          )}
        </dd>
        {item.lastRefundError === null ? null : (
          <>
            <dt>{text["returns.detail.refundError"]}</dt>
            <dd>
              <q lang="en">{item.lastRefundError}</q>
            </dd>
          </>
        )}
      </dl>
      <section className={styles.danger} aria-labelledby="return-reject-title">
        <h3 id="return-reject-title" className={styles.sectionTitle}>
          {text["returns.reject.section"]}
        </h3>
        {offered ? (
          <>
            <p className={styles.sectionBody}>{text["returns.reject.body"]}</p>
            <Button variant="secondary" onPress={ask}>
              <XCircle aria-hidden="true" />
              {text["returns.reject.open"]}
            </Button>
          </>
        ) : (
          <p className={styles.sectionBody}>{gone ? text["returns.reject.gone"] : text["returns.reject.notOffered"]}</p>
        )}
      </section>
      <ConfirmDialog
        open={asking}
        title={formatText(text["returns.reject.title"], { number: item.returnNumber })}
        body={text["returns.reject.confirmBody"]}
        confirm={
          reject.isPending
            ? text["returns.reject.working"]
            : unknownBefore
              ? text["returns.reject.again"]
              : text["returns.reject.confirm"]
        }
        back={text["returns.reject.cancel"]}
        working={reject.isPending}
        problem={alreadyAfterRetry ? { lead: text["returns.failure.alreadyAfterRetry"], quote: null } : problem}
        onConfirm={confirm}
        onClose={() => setAsking(false)}
      >
        <TextField
          className={styles.reason}
          value={reason}
          maxLength={reasonLength}
          isRequired
          validationBehavior="aria"
          isInvalid={blank}
          isDisabled={reject.isPending}
          autoFocus
          onChange={(value) => {
            setBlank(false)
            setReason(value)
          }}
        >
          <Label className={styles.reasonLabel}>{text["returns.reject.reason"]}</Label>
          <TextArea className={styles.reasonInput} />
          <Text slot="description" className={styles.reasonNote}>
            {formatText(text["returns.reject.reasonNote"], {
              left: new Intl.NumberFormat(locale).format(reasonLength - reason.length)
            })}
          </Text>
          <FieldError className={styles.reasonError}>{text["returns.reject.reasonRequired"]}</FieldError>
        </TextField>
      </ConfirmDialog>
    </article>
  )
}

export { ReturnView }
