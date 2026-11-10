import { useQuery } from "@tanstack/react-query"
import { m } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { Button as IconButton } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { OrderReport } from "../../types/order_report.type"
import type { OrdersSearch } from "../../types/orders_search.type"
import { Button } from "../../ui/Button"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { ArrowLeft } from "../../ui/icons/ArrowLeft"
import { ArrowRight } from "../../ui/icons/ArrowRight"
import { Receipt } from "../../ui/icons/Receipt"
import { KeyHints } from "../../ui/KeyHints"
import { enter } from "../../ui/motion/motion_presets"
import { Notice } from "../../ui/Notice"
import { PageHeader } from "../../ui/PageHeader"
import { usePageKeys } from "../../ui/use_page_keys"
import { usePresence } from "../../ui/use_presence"
import { completionText } from "./completion_text"
import { filterKey, OrderFilters } from "./OrderFilters"
import styles from "./Orders.module.css"
import { OrdersSwitch } from "./OrdersSwitch"
import { OrderTable } from "./OrderTable"
import { OrderView } from "./OrderView"
import { cursorRefused, filtersRefused, searchFailure } from "./order_failure"
import { orderQueryOf } from "./order_query_of"
import { orderSearchQuery } from "./orders_queries"
import { useOrdersText } from "./orders_text"

function OrdersPage({ search, onSearch }: { search: OrdersSearch; onSearch: (next: OrdersSearch) => void }) {
  const text = useOrdersText()
  const numbers = new Intl.NumberFormat(useLocale())
  const poll = usePresence()
  const results = useQuery(orderSearchQuery(orderQueryOf(search)))
  const orders = results.data?.orders
  const [report, setReport] = useState<OrderReport | null>(null)
  const [completeRequest, setCompleteRequest] = useState(0)
  const detailColumn = useRef<HTMLDivElement>(null)
  const chosenAlone = useRef<string | null>(null)
  const listed = orders?.find((order) => order.id === search.order)
  const sole = search.orderNumber !== undefined && orders?.length === 1 ? orders[0] : undefined

  function choose(id: string): void {
    setReport(null)
    onSearch({ ...search, order: id })
  }

  function step(by: number): void {
    if (orders === undefined || orders.length === 0) {
      return
    }

    const at = orders.findIndex((order) => order.id === search.order)
    const next = orders[at === -1 ? (by > 0 ? 0 : orders.length - 1) : (at + by + orders.length) % orders.length]
    if (next !== undefined) {
      choose(next.id)
    }
  }

  usePageKeys(
    {
      j: () => step(1),
      k: () => step(-1),
      c: search.order === undefined ? null : () => setCompleteRequest((count) => count + 1),
      "/": () => document.getElementById("order-number-filter")?.focus()
    },
    true
  )

  useEffect(() => {
    if (sole === undefined || search.order !== undefined || chosenAlone.current === sole.id) {
      return
    }

    chosenAlone.current = sole.id
    onSearch({ ...search, order: sole.id })
  }, [sole, search, onSearch])

  useEffect(() => {
    if (search.order === undefined || window.matchMedia("(min-width: 64rem)").matches) {
      return
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    detailColumn.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" })
  }, [search.order])

  function apply(next: OrdersSearch): void {
    setReport(null)
    onSearch(next)
  }

  function listBody() {
    if (results.isPending) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["orders.results.loading"]}
        </p>
      )
    }

    if (results.isError && results.data === undefined) {
      const failure = results.error instanceof BffError ? results.error.failure : null
      const explanation = failure === null ? null : searchFailure(failure, text)

      return (
        <div className={styles.problem} role="alert">
          <p className={styles.problemText}>
            {explanation === null ? text["orders.failure.unknown"] : explanation.lead}
            {explanation?.quote === null || explanation === null ? null : (
              <q className={styles.quote} lang="en">
                {explanation.quote}
              </q>
            )}
          </p>
          {failure !== null && cursorRefused(failure) ? (
            <Button variant="secondary" onPress={() => apply({ ...search, before: undefined, order: undefined })}>
              <ArrowLeft aria-hidden="true" />
              {text["orders.results.newest"]}
            </Button>
          ) : failure !== null && filtersRefused(failure) ? (
            <Button variant="secondary" onPress={() => apply({})}>
              {text["orders.filters.clear"]}
            </Button>
          ) : (
            <Button variant="secondary" onPress={() => void results.refetch()}>
              {text["error.retry"]}
            </Button>
          )}
        </div>
      )
    }

    if (orders === undefined || orders.length === 0) {
      return <p className={styles.listState}>{text["orders.results.empty"]}</p>
    }

    return <OrderTable orders={orders} search={search} selected={search.order ?? null} />
  }

  const nextCursor = results.data?.nextCursor ?? null

  return (
    <>
      <PageHeader eyebrow={text["orders.eyebrow"]} title={text["orders.title"]} lead={text["orders.lead"]} />
      <div className={styles.desk}>
        <OrdersSwitch screen="orders" poll={poll} />
        <KeyHints
          label={text["orders.keys.label"]}
          hints={[
            { keys: ["J", "K"], label: text["orders.keys.move"] },
            { keys: ["C"], label: text["orders.keys.complete"] },
            { keys: ["/"], label: text["orders.keys.filter"] }
          ]}
        />
      </div>
      <OrderFilters key={filterKey(search)} search={search} onApply={apply} />
      <div className={styles.workspace}>
        <section className={styles.listColumn} aria-labelledby="orders-results-title" aria-busy={results.isFetching}>
          <div className={styles.listHead}>
            <h2 id="orders-results-title" className={styles.listTitle}>
              {text["orders.results.title"]}
              {orders === undefined ? null : (
                <span className={styles.count}>
                  {formatText(text["orders.results.count"], { count: numbers.format(orders.length) })}
                </span>
              )}
            </h2>
            <IconButton
              className={styles.refresh}
              aria-label={text["orders.results.refresh"]}
              isDisabled={results.isFetching}
              onPress={() => void results.refetch()}
            >
              <ArrowClockwise aria-hidden="true" />
            </IconButton>
          </div>
          {listBody()}
          {results.data === undefined || (nextCursor === null && search.before === undefined) ? null : (
            <div className={styles.pager}>
              {search.before === undefined ? (
                <span />
              ) : (
                <Button variant="quiet" onPress={() => apply({ ...search, before: undefined, order: undefined })}>
                  <ArrowLeft aria-hidden="true" />
                  {text["orders.results.newest"]}
                </Button>
              )}
              {nextCursor === null ? null : (
                <Button variant="quiet" onPress={() => apply({ ...search, before: nextCursor, order: undefined })}>
                  {text["orders.results.older"]}
                  <ArrowRight aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
        </section>
        <div ref={detailColumn} className={styles.detailColumn}>
          {report === null ? null : (
            <m.div
              key={report.orderNumber}
              className={styles.notice}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter}
            >
              <Notice tone="info">{completionText(report, text)}</Notice>
            </m.div>
          )}
          {search.order === undefined ? (
            <div className={styles.idle}>
              <Receipt aria-hidden="true" size={28} />
              <p className={styles.idleTitle}>{text["orders.idle.title"]}</p>
              <p className={styles.idleBody}>{text["orders.idle.body"]}</p>
            </div>
          ) : (
            <OrderView
              key={search.order}
              orderId={search.order}
              listed={listed}
              completeRequest={completeRequest}
              onCompleted={setReport}
            />
          )}
        </div>
      </div>
    </>
  )
}

export { OrdersPage }
