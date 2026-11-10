import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { m } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button as IconButton, Input, SearchField } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { queuePageSize } from "../../api/queue_page"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { AttentionReturn } from "../../types/attention_return.type"
import type { QueueSearch } from "../../types/queue_search.type"
import type { ReturnReport } from "../../types/return_report.type"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { ArrowUUpLeft } from "../../ui/icons/ArrowUUpLeft"
import { MagnifyingGlass } from "../../ui/icons/MagnifyingGlass"
import { KeyHints } from "../../ui/KeyHints"
import { enter } from "../../ui/motion/motion_presets"
import { Notice } from "../../ui/Notice"
import { PageHeader } from "../../ui/PageHeader"
import { PanelProblem } from "../../ui/PanelProblem"
import { usePageKeys } from "../../ui/use_page_keys"
import { usePresence } from "../../ui/use_presence"
import styles from "./Orders.module.css"
import { OrdersSwitch } from "./OrdersSwitch"
import { attentionReturnsQuery } from "./orders_queries"
import { useOrdersText } from "./orders_text"
import { ReturnList } from "./ReturnList"
import { ReturnView } from "./ReturnView"

function matches(item: AttentionReturn, query: string): boolean {
  const wanted = query.trim().toLowerCase()
  if (wanted.length === 0) {
    return true
  }

  return [item.returnNumber, item.orderNumber].some((value) => value.toLowerCase().includes(wanted))
}

function ReturnsPage({ search, onSearch }: { search: QueueSearch; onSearch: (next: QueueSearch) => void }) {
  const text = useOrdersText()
  const numbers = new Intl.NumberFormat(useLocale())
  const poll = usePresence()
  const list = useQuery(attentionReturnsQuery())
  const [query, setQuery] = useState("")
  const [report, setReport] = useState<ReturnReport | null>(null)
  const [rejectRequest, setRejectRequest] = useState(0)
  const detailColumn = useRef<HTMLDivElement>(null)
  const returns = list.data
  const shown = useMemo(() => (returns ?? []).filter((item) => matches(item, query)), [returns, query])
  const found = returns?.find((item) => item.returnNumber === search.selected) ?? null
  const lastFound = useRef<AttentionReturn | null>(null)

  if (found !== null) {
    lastFound.current = found
  }

  const held = lastFound.current?.returnNumber === search.selected ? lastFound.current : null
  const selected = found ?? held

  function choose(returnNumber: string): void {
    setReport(null)
    onSearch({ selected: returnNumber })
  }

  function step(by: number): void {
    if (shown.length === 0) {
      return
    }

    const at = shown.findIndex((item) => item.returnNumber === search.selected)
    const next = shown[at === -1 ? (by > 0 ? 0 : shown.length - 1) : (at + by + shown.length) % shown.length]
    if (next !== undefined) {
      choose(next.returnNumber)
    }
  }

  usePageKeys(
    {
      j: () => step(1),
      k: () => step(-1),
      r: found === null ? null : () => setRejectRequest((count) => count + 1),
      "/": () => document.getElementById("return-filter")?.focus()
    },
    true
  )

  useEffect(() => {
    if (search.selected === undefined || window.matchMedia("(min-width: 64rem)").matches) {
      return
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    detailColumn.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" })
  }, [search.selected])

  function rejected(next: ReturnReport): void {
    const at = shown.findIndex((item) => item.returnNumber === next.returnNumber)
    const following = shown[at + 1] ?? shown[at - 1]
    setReport(next)
    onSearch(following === undefined ? {} : { selected: following.returnNumber })
  }

  function listBody() {
    if (list.isPending) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["returns.list.loading"]}
        </p>
      )
    }

    if (list.isError && returns === undefined) {
      return (
        <PanelProblem
          failure={list.error instanceof BffError ? list.error.failure : null}
          onRetry={() => void list.refetch()}
        />
      )
    }

    if (returns === undefined || returns.length === 0) {
      return <p className={styles.listState}>{text["returns.list.empty"]}</p>
    }

    if (shown.length === 0) {
      return <p className={styles.listState}>{text["returns.filter.none"]}</p>
    }

    return <ReturnList returns={shown} selected={search.selected ?? null} onSelect={choose} />
  }

  function detail() {
    if (selected !== null) {
      return (
        <m.div
          key={selected.returnNumber}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={enter}
        >
          <ReturnView
            key={selected.returnNumber}
            item={selected}
            gone={found === null}
            rejectRequest={rejectRequest}
            onRejected={rejected}
          />
        </m.div>
      )
    }

    const missing = search.selected !== undefined && returns !== undefined && report === null

    return (
      <div className={styles.idle} role={missing ? "status" : undefined}>
        <ArrowUUpLeft aria-hidden="true" size={28} />
        <p className={styles.idleTitle}>{missing ? text["returns.missing.title"] : text["returns.idle.title"]}</p>
        <p className={styles.idleBody}>
          {missing
            ? formatText(text["returns.missing.body"], { number: search.selected ?? "" })
            : text["returns.idle.body"]}
        </p>
      </div>
    )
  }

  return (
    <>
      <PageHeader eyebrow={text["orders.eyebrow"]} title={text["returns.title"]} lead={text["returns.lead"]} />
      <div className={styles.desk}>
        <OrdersSwitch screen="returns" poll={poll} />
        <KeyHints
          label={text["orders.keys.label"]}
          hints={[
            { keys: ["J", "K"], label: text["returns.keys.move"] },
            { keys: ["R"], label: text["returns.keys.reject"] },
            { keys: ["/"], label: text["returns.keys.filter"] }
          ]}
        />
      </div>
      <div className={styles.workspace} data-shape="queue">
        <section className={styles.listColumn} aria-labelledby="returns-title" aria-busy={list.isFetching}>
          <div className={styles.listHead}>
            <h2 id="returns-title" className={styles.listTitle}>
              {text["returns.list.title"]}
              {returns === undefined ? null : (
                <span className={styles.count}>
                  {formatText(text["returns.list.count"], { count: numbers.format(returns.length) })}
                </span>
              )}
            </h2>
            <IconButton
              className={styles.refresh}
              aria-label={text["returns.refresh"]}
              isDisabled={list.isFetching}
              onPress={() => void list.refetch()}
            >
              <ArrowClockwise aria-hidden="true" />
            </IconButton>
          </div>
          <SearchField
            aria-label={text["returns.filter.label"]}
            value={query}
            onChange={setQuery}
            className={styles.filter}
          >
            <MagnifyingGlass aria-hidden="true" className={styles.filterIcon} />
            <Input id="return-filter" className={styles.filterInput} placeholder={text["returns.filter.description"]} />
          </SearchField>
          {listBody()}
          {returns !== undefined && returns.length >= queuePageSize ? (
            <p className={styles.note}>
              {formatText(text["returns.list.limit"], { shown: numbers.format(returns.length) })}
            </p>
          ) : null}
        </section>
        <div ref={detailColumn} className={styles.detailColumn}>
          {report === null ? null : (
            <m.div
              key={report.returnNumber}
              className={styles.notice}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter}
            >
              <Notice tone="info">
                {formatText(text["returns.reject.done"], { number: report.returnNumber, order: report.orderNumber })}
                <span className={styles.noticeActions}>
                  <Link to="/orders" search={{ orderNumber: report.orderNumber }} className={styles.inlineLink}>
                    {formatText(text["returns.reject.findOrder"], { order: report.orderNumber })}
                  </Link>
                </span>
              </Notice>
            </m.div>
          )}
          {detail()}
        </div>
      </div>
    </>
  )
}

export { ReturnsPage }
