import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { completeOrderCall } from "../../api/calls/complete_order_call"
import { outcomeUnknown } from "../../api/outcome_unknown"
import { formatDistance } from "../../i18n/format_distance"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { AttentionReturn } from "../../types/attention_return.type"
import type { OrderDetail } from "../../types/order_detail.type"
import type { OrderReport } from "../../types/order_report.type"
import type { OrderSummary } from "../../types/order_summary.type"
import { Button } from "../../ui/Button"
import { CopyValue } from "../../ui/CopyValue"
import { CheckCircle } from "../../ui/icons/CheckCircle"
import { Receipt } from "../../ui/icons/Receipt"
import { PanelProblem } from "../../ui/PanelProblem"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import { useSettled } from "../../ui/use_settled"
import { returnsKey } from "../overview/overview_queries"
import { ConfirmDialog } from "./ConfirmDialog"
import { rupiah } from "./money"
import styles from "./Orders.module.css"
import { completionFailure, decidedElsewhere } from "./order_failure"
import { orderTone } from "./order_tone"
import { attentionReturnsQuery, orderKey, orderQuery, orderRowQuery, searchKey } from "./orders_queries"
import { useOrdersText } from "./orders_text"

function minus(amount: number): number {
  return amount === 0 ? 0 : -amount
}

const quoteBases = ["DISTANCE_QUOTED", "TIER_FLOOR", "CLIENT_SUPPLIED"] as const

function basisKey(basis: string) {
  const known = quoteBases.find((candidate) => candidate === basis)

  return known === undefined ? null : (`orders.basis.${known}` as const)
}

function Moment({ name, instant, pending }: { name: string; instant: Date | null; pending: string }) {
  const locale = useLocale()
  const exact = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" })

  return (
    <li className={styles.moment} data-reached={instant !== null}>
      <span className={styles.momentName}>{name}</span>
      <span>
        {instant === null ? (
          pending
        ) : (
          <>
            {exact.format(instant)}{" "}
            <span className={styles.quiet}>
              (<RelativeTime instant={instant} />)
            </span>
          </>
        )}
      </span>
    </li>
  )
}

function OrderTimeline({ order, row }: { order: OrderDetail; row: OrderSummary | undefined }) {
  const text = useOrdersText()

  return (
    <section className={styles.section} aria-labelledby="order-timeline-title">
      <h3 id="order-timeline-title" className={styles.sectionTitle}>
        {text["orders.timeline.title"]}
      </h3>
      <ol className={styles.timeline}>
        <Moment name={text["orders.timeline.placed"]} instant={order.createdAt} pending="" />
        {row === undefined ? null : (
          <>
            <Moment
              name={text["orders.timeline.delivered"]}
              instant={row.deliveredAt}
              pending={text["orders.timeline.notYet"]}
            />
            <Moment
              name={text["orders.timeline.completed"]}
              instant={row.completedAt}
              pending={text["orders.timeline.notYet"]}
            />
            <Moment name={text["orders.timeline.changed"]} instant={row.updatedAt} pending="" />
          </>
        )}
      </ol>
      <p className={styles.note}>
        {row === undefined ? text["orders.timeline.partial"] : text["orders.timeline.note"]}
      </p>
    </section>
  )
}

function OrderReturns({ returns, failed }: { returns: readonly AttentionReturn[] | undefined; failed: boolean }) {
  const text = useOrdersText()
  const exact = new Intl.DateTimeFormat(useLocale(), { dateStyle: "medium", timeStyle: "short" })

  function body() {
    if (returns === undefined) {
      return (
        <p className={styles.sectionBody}>
          {failed ? text["orders.return.unreadable"] : text["orders.return.loading"]}
        </p>
      )
    }

    if (returns.length === 0) {
      return <p className={styles.sectionBody}>{text["orders.return.none"]}</p>
    }

    return returns.map((item) => (
      <div key={item.returnNumber} className={styles.returnBlock}>
        <dl className={styles.facts}>
          <dt>{text["returns.detail.number"]}</dt>
          <dd className={styles.mono}>{item.returnNumber}</dd>
          <dt>{text["returns.detail.status"]}</dt>
          <dd>
            <StatusTag tone="attention">{text[`returns.status.${item.status}`]}</StatusTag>
          </dd>
          <dt>{text["returns.detail.reason"]}</dt>
          <dd>{item.reason}</dd>
          <dt>{text["returns.detail.opened"]}</dt>
          <dd>{exact.format(item.openedAt)}</dd>
        </dl>
        <p className={styles.sectionBody}>
          <Link to="/orders/returns" search={{ selected: item.returnNumber }} className={styles.inlineLink}>
            {formatText(text["orders.return.open"], { number: item.returnNumber })}
          </Link>
        </p>
      </div>
    ))
  }

  return (
    <section className={styles.section} aria-labelledby="order-return-title">
      <h3 id="order-return-title" className={styles.sectionTitle}>
        {text["orders.return.title"]}
      </h3>
      {body()}
    </section>
  )
}

function OrderView({
  orderId,
  listed,
  completeRequest,
  onCompleted
}: {
  orderId: string
  listed: OrderSummary | undefined
  completeRequest: number
  onCompleted: (report: OrderReport) => void
}) {
  const text = useOrdersText()
  const locale = useLocale()
  const money = rupiah(locale)
  const numbers = new Intl.NumberFormat(locale)
  const queryClient = useQueryClient()
  const settled = useSettled(orderId, 350)
  const order = useQuery(orderQuery(settled === orderId ? orderId : null))
  const detail = order.data ?? null
  const lookup = useQuery(orderRowQuery(listed === undefined && detail !== null ? detail.orderNumber : null))
  const row = listed ?? lookup.data?.orders.find((candidate) => candidate.id === orderId)
  const returns = useQuery(attentionReturnsQuery())
  const against = detail === null ? undefined : returns.data?.filter((item) => item.orderNumber === detail.orderNumber)
  const blocking = against?.[0]
  const offered = detail?.status === "DELIVERED" && blocking === undefined
  const [asking, setAsking] = useState(false)
  const [unknownBefore, setUnknownBefore] = useState(false)
  const handled = useRef(completeRequest)

  const complete = useMutation({
    mutationFn: (orderNumber: string) => bffFetch(completeOrderCall(orderNumber)),
    onSuccess: (result) => {
      queryClient.setQueryData<OrderDetail | null>(orderKey(orderId), (current) =>
        current === undefined || current === null ? current : { ...current, status: "COMPLETED" }
      )

      void queryClient.invalidateQueries({ queryKey: searchKey })
      setAsking(false)
      setUnknownBefore(false)
      onCompleted({ orderNumber: result.orderNumber, escrowReleased: result.escrowReleased, detail: result.detail })
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
        void queryClient.invalidateQueries({ queryKey: orderKey(orderId) })
        void queryClient.invalidateQueries({ queryKey: searchKey })
        void queryClient.invalidateQueries({ queryKey: returnsKey })
      }
    }
  })

  const resetCompletion = complete.reset

  function ask(): void {
    resetCompletion()
    setAsking(true)
  }

  useEffect(() => {
    if (completeRequest === handled.current) {
      return
    }

    handled.current = completeRequest

    if (offered) {
      resetCompletion()
      setAsking(true)
    }
  }, [completeRequest, offered, resetCompletion])

  if (settled !== orderId || order.isPending) {
    return (
      <p className={styles.listState} aria-busy="true">
        {text["orders.detail.loading"]}
      </p>
    )
  }

  if (order.isError) {
    return (
      <PanelProblem
        failure={order.error instanceof BffError ? order.error.failure : null}
        onRetry={() => void order.refetch()}
      />
    )
  }

  if (detail === null) {
    return (
      <div className={styles.idle} role="status">
        <Receipt aria-hidden="true" size={28} />
        <p className={styles.idleTitle}>{text["orders.detail.missingTitle"]}</p>
        <p className={styles.idleBody}>{text["orders.detail.missing"]}</p>
      </div>
    )
  }

  const problem = complete.error instanceof BffError ? completionFailure(complete.error.failure, text) : null
  const alreadyAfterRetry =
    unknownBefore &&
    complete.error instanceof BffError &&
    complete.error.failure.kind === "refused" &&
    complete.error.failure.code === "ORDER_ALREADY_COMPLETED"

  const basis = basisKey(detail.shippingQuoteBasis)
  const values = { number: detail.orderNumber }

  function completion() {
    if (detail === null) {
      return null
    }

    if (detail.status === "COMPLETED") {
      return (
        <p className={styles.sectionBody}>
          <CheckCircle aria-hidden="true" /> {text["orders.complete.done"]}
        </p>
      )
    }

    if (detail.status !== "DELIVERED") {
      return <p className={styles.sectionBody}>{text["orders.complete.notDelivered"]}</p>
    }

    if (blocking !== undefined) {
      return (
        <p className={styles.sectionBody}>
          {formatText(text["orders.complete.blocked"], { number: blocking.returnNumber })}
        </p>
      )
    }

    return (
      <>
        <p className={styles.sectionBody}>{text["orders.complete.body"]}</p>
        <Button variant="secondary" onPress={ask}>
          <CheckCircle aria-hidden="true" />
          {text["orders.complete.open"]}
        </Button>
      </>
    )
  }

  return (
    <article className={styles.detail} aria-labelledby="order-title">
      <header className={styles.detailHead}>
        <p className={styles.kicker}>
          <Receipt aria-hidden="true" />
          {text["orders.detail.kicker"]}
        </p>
        <h2 id="order-title" className={styles.detailTitle}>
          <span>{detail.orderNumber}</span>
          <StatusTag tone={orderTone(detail.status)}>{text[`orders.status.${detail.status}`]}</StatusTag>
        </h2>
        <p className={styles.detailLead}>
          {formatText(text["orders.detail.lead"], {
            items: numbers.format(detail.items.length),
            total: money.format(detail.finalTotal)
          })}
        </p>
      </header>
      <dl className={styles.facts}>
        <dt>{text["orders.detail.id"]}</dt>
        <dd className={styles.mono}>
          <CopyValue value={detail.id} label={text["orders.detail.id"]} />
        </dd>
        <dt>{text["orders.detail.buyer"]}</dt>
        <dd className={styles.mono}>
          <CopyValue value={detail.customerPrincipalId} label={text["orders.detail.buyer"]} />
        </dd>
        <dt>{text["orders.detail.seller"]}</dt>
        <dd className={styles.mono}>
          <CopyValue value={detail.merchantPrincipalId} label={text["orders.detail.seller"]} />
        </dd>
        <dt>{text["orders.detail.courier"]}</dt>
        <dd className={styles.mono}>
          {detail.driverPrincipalId === null ? (
            <span className={styles.quiet}>{text["orders.detail.noCourier"]}</span>
          ) : (
            <CopyValue value={detail.driverPrincipalId} label={text["orders.detail.courier"]} />
          )}
        </dd>
      </dl>
      <section className={styles.section} aria-labelledby="order-items-title">
        <h3 id="order-items-title" className={styles.sectionTitle}>
          {text["orders.items.title"]}
        </h3>
        <div className={styles.tableFrame}>
          <table className={styles.lines}>
            <thead>
              <tr>
                <th scope="col">{text["orders.items.product"]}</th>
                <th scope="col" className={styles.number}>
                  {text["orders.items.unitPrice"]}
                </th>
                <th scope="col" className={styles.number}>
                  {text["orders.items.quantity"]}
                </th>
                <th scope="col" className={styles.number}>
                  {text["orders.items.subtotal"]}
                </th>
              </tr>
            </thead>
            <tbody>
              {detail.items.map((line) => (
                <tr key={line.id}>
                  <th scope="row">
                    <span className={styles.productTitle}>{line.productTitle}</span>
                    <span className={styles.productId}>{line.productId}</span>
                  </th>
                  <td className={styles.number}>{money.format(line.unitPrice)}</td>
                  <td className={styles.number}>{numbers.format(line.quantity)}</td>
                  <td className={styles.number}>{money.format(line.lineSubtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className={styles.sums}>
          <dt>{text["orders.totals.goods"]}</dt>
          <dd>{money.format(detail.subtotal)}</dd>
          <dt>
            {detail.appliedVoucher === null
              ? text["orders.totals.discount"]
              : formatText(text["orders.totals.voucher"], { code: detail.appliedVoucher })}
          </dt>
          <dd>{money.format(minus(detail.discountAmount))}</dd>
          <dt>{text["orders.totals.shipping"]}</dt>
          <dd>{money.format(detail.finalShippingFee)}</dd>
          <dt className={styles.total}>{text["orders.totals.total"]}</dt>
          <dd className={styles.total}>{money.format(detail.finalTotal)}</dd>
        </dl>
      </section>
      <section className={styles.section} aria-labelledby="order-shipping-title">
        <h3 id="order-shipping-title" className={styles.sectionTitle}>
          {text["orders.shipping.title"]}
        </h3>
        <dl className={styles.facts}>
          <dt>{text["orders.shipping.address"]}</dt>
          <dd>{detail.shippingAddress}</dd>
          <dt>{text["orders.shipping.tier"]}</dt>
          <dd className={styles.mono}>{detail.shippingServiceTier}</dd>
          <dt>{text["orders.shipping.baseFee"]}</dt>
          <dd>{money.format(detail.baseShippingFee)}</dd>
          <dt>{text["orders.shipping.discount"]}</dt>
          <dd>{money.format(minus(detail.shippingDiscount))}</dd>
          <dt>{text["orders.shipping.finalFee"]}</dt>
          <dd>{money.format(detail.finalShippingFee)}</dd>
          <dt>{text["orders.shipping.distance"]}</dt>
          <dd>{formatDistance(detail.distanceKm, locale)}</dd>
          <dt>{text["orders.shipping.basis"]}</dt>
          <dd>{basis === null ? <span className={styles.mono}>{detail.shippingQuoteBasis}</span> : text[basis]}</dd>
        </dl>
      </section>
      <OrderTimeline order={detail} row={row} />
      <OrderReturns returns={against} failed={returns.isError} />
      <section className={styles.danger} aria-labelledby="order-complete-title">
        <h3 id="order-complete-title" className={styles.sectionTitle}>
          {text["orders.complete.title"]}
        </h3>
        {completion()}
      </section>
      <ConfirmDialog
        open={asking}
        title={formatText(text["orders.complete.confirmTitle"], values)}
        body={text["orders.complete.confirmBody"]}
        confirm={
          complete.isPending
            ? text["orders.complete.working"]
            : unknownBefore
              ? text["orders.complete.again"]
              : text["orders.complete.confirm"]
        }
        back={text["orders.complete.back"]}
        working={complete.isPending}
        problem={alreadyAfterRetry ? { lead: text["orders.complete.failure.alreadyAfterRetry"], quote: null } : problem}
        onConfirm={() => complete.mutate(detail.orderNumber)}
        onClose={() => setAsking(false)}
      />
    </article>
  )
}

export { OrderView }
