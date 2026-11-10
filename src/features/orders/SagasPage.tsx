import { useQuery } from "@tanstack/react-query"
import { m } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button as IconButton, Input, SearchField } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { queuePageSize } from "../../api/queue_page"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { AttentionSaga } from "../../types/attention_saga.type"
import type { QueueSearch } from "../../types/queue_search.type"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { LinkBreak } from "../../ui/icons/LinkBreak"
import { MagnifyingGlass } from "../../ui/icons/MagnifyingGlass"
import { KeyHints } from "../../ui/KeyHints"
import { enter } from "../../ui/motion/motion_presets"
import { PageHeader } from "../../ui/PageHeader"
import { PanelProblem } from "../../ui/PanelProblem"
import { usePageKeys } from "../../ui/use_page_keys"
import { usePresence } from "../../ui/use_presence"
import { sagasQuery } from "../overview/overview_queries"
import styles from "./Orders.module.css"
import { OrdersSwitch } from "./OrdersSwitch"
import { attentionSagasQuery } from "./orders_queries"
import { useOrdersText } from "./orders_text"
import { SagaList } from "./SagaList"
import { SagaView } from "./SagaView"

function matches(saga: AttentionSaga, query: string): boolean {
  const wanted = query.trim().toLowerCase()
  if (wanted.length === 0) {
    return true
  }

  return [saga.orderNumber, saga.sagaId, saga.lastFailureCode ?? "", saga.correlationId].some((value) =>
    value.toLowerCase().includes(wanted)
  )
}

function SagasPage({ search, onSearch }: { search: QueueSearch; onSearch: (next: QueueSearch) => void }) {
  const text = useOrdersText()
  const numbers = new Intl.NumberFormat(useLocale())
  const poll = usePresence()
  const count = useQuery(sagasQuery(poll))
  const list = useQuery(attentionSagasQuery())
  const [query, setQuery] = useState("")
  const detailColumn = useRef<HTMLDivElement>(null)
  const sagas = list.data
  const shown = useMemo(() => (sagas ?? []).filter((saga) => matches(saga, query)), [sagas, query])
  const selected = sagas?.find((saga) => saga.sagaId === search.selected) ?? null
  const refetchList = list.refetch

  useEffect(() => {
    if (count.data === undefined || sagas === undefined || list.isFetching) {
      return
    }

    const comparable = sagas.length < queuePageSize || count.data < queuePageSize
    if (comparable && count.dataUpdatedAt > list.dataUpdatedAt && count.data !== sagas.length) {
      void refetchList()
    }
  }, [count.data, count.dataUpdatedAt, sagas, list.dataUpdatedAt, list.isFetching, refetchList])

  function choose(id: string): void {
    onSearch({ selected: id })
  }

  function step(by: number): void {
    if (shown.length === 0) {
      return
    }

    const at = shown.findIndex((saga) => saga.sagaId === search.selected)
    const next = shown[at === -1 ? (by > 0 ? 0 : shown.length - 1) : (at + by + shown.length) % shown.length]
    if (next !== undefined) {
      choose(next.sagaId)
    }
  }

  usePageKeys(
    {
      j: () => step(1),
      k: () => step(-1),
      "/": () => document.getElementById("saga-filter")?.focus()
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

  function listBody() {
    if (list.isPending) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["sagas.list.loading"]}
        </p>
      )
    }

    if (list.isError && sagas === undefined) {
      return (
        <PanelProblem
          failure={list.error instanceof BffError ? list.error.failure : null}
          onRetry={() => void list.refetch()}
        />
      )
    }

    if (sagas === undefined || sagas.length === 0) {
      return <p className={styles.listState}>{text["sagas.list.empty"]}</p>
    }

    if (shown.length === 0) {
      return <p className={styles.listState}>{text["sagas.filter.none"]}</p>
    }

    return <SagaList sagas={shown} selected={search.selected ?? null} onSelect={choose} />
  }

  function detail() {
    if (selected !== null) {
      return (
        <m.div key={selected.sagaId} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
          <SagaView saga={selected} />
        </m.div>
      )
    }

    return (
      <div className={styles.idle}>
        <LinkBreak aria-hidden="true" size={28} />
        <p className={styles.idleTitle}>
          {search.selected === undefined || sagas === undefined
            ? text["sagas.idle.title"]
            : text["sagas.missing.title"]}
        </p>
        <p className={styles.idleBody}>
          {search.selected === undefined || sagas === undefined ? text["sagas.idle.body"] : text["sagas.missing.body"]}
        </p>
      </div>
    )
  }

  const total = count.data

  return (
    <>
      <PageHeader eyebrow={text["orders.eyebrow"]} title={text["sagas.title"]} lead={text["sagas.lead"]} />
      <div className={styles.desk}>
        <OrdersSwitch screen="sagas" poll={poll} />
        <KeyHints
          label={text["orders.keys.label"]}
          hints={[
            { keys: ["J", "K"], label: text["sagas.keys.move"] },
            { keys: ["/"], label: text["sagas.keys.filter"] }
          ]}
        />
      </div>
      <div className={styles.workspace} data-shape="queue">
        <section className={styles.listColumn} aria-labelledby="sagas-title" aria-busy={list.isFetching}>
          <div className={styles.listHead}>
            <h2 id="sagas-title" className={styles.listTitle}>
              {text["sagas.list.title"]}
              {sagas === undefined ? null : (
                <span className={styles.count}>
                  {formatText(text["sagas.list.count"], { count: numbers.format(sagas.length) })}
                </span>
              )}
            </h2>
            <IconButton
              className={styles.refresh}
              aria-label={text["sagas.refresh"]}
              isDisabled={list.isFetching}
              onPress={() => void list.refetch()}
            >
              <ArrowClockwise aria-hidden="true" />
            </IconButton>
          </div>
          <SearchField
            aria-label={text["sagas.filter.label"]}
            value={query}
            onChange={setQuery}
            className={styles.filter}
          >
            <MagnifyingGlass aria-hidden="true" className={styles.filterIcon} />
            <Input id="saga-filter" className={styles.filterInput} placeholder={text["sagas.filter.description"]} />
          </SearchField>
          {listBody()}
          {sagas !== undefined && total !== undefined && sagas.length >= queuePageSize && total > sagas.length ? (
            <p className={styles.note}>
              {formatText(text["sagas.list.limit"], {
                shown: numbers.format(sagas.length),
                total: numbers.format(total)
              })}
            </p>
          ) : null}
        </section>
        <div ref={detailColumn} className={styles.detailColumn}>
          {detail()}
        </div>
      </div>
    </>
  )
}

export { SagasPage }
