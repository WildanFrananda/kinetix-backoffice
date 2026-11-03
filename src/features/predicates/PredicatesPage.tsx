import { useQuery } from "@tanstack/react-query"
import { m } from "motion/react"
import { useMemo, useState } from "react"
import { Button as IconButton } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { PredicateReport } from "../../types/predicate_report.type"
import type { PredicatesSearch } from "../../types/predicates_search.type"
import { Button } from "../../ui/Button"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { Plus } from "../../ui/icons/Plus"
import { SealCheck } from "../../ui/icons/SealCheck"
import { KeyHints } from "../../ui/KeyHints"
import { enter } from "../../ui/motion/motion_presets"
import { Notice } from "../../ui/Notice"
import { PageHeader } from "../../ui/PageHeader"
import { PanelProblem } from "../../ui/PanelProblem"
import { usePageKeys } from "../../ui/use_page_keys"
import { PredicateDetail } from "./PredicateDetail"
import { PredicateForm } from "./PredicateForm"
import { PredicateList } from "./PredicateList"
import styles from "./Predicates.module.css"
import { predicatesQuery } from "./predicates_queries"
import { usePredicatesText } from "./predicates_text"

function PredicatesPage({
  search,
  onSearch
}: {
  search: PredicatesSearch
  onSearch: (next: PredicatesSearch) => void
}) {
  const text = usePredicatesText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const listing = useQuery(predicatesQuery())
  const [report, setReport] = useState<PredicateReport | null>(null)
  const [withdrawRequest, setWithdrawRequest] = useState(0)
  const predicates = useMemo(
    () =>
      [...(listing.data?.predicates ?? [])].sort((a, b) =>
        a.label.localeCompare(b.label, locale, { sensitivity: "base" })
      ),
    [listing.data, locale]
  )

  const creating = search.creating === true
  const selected = creating ? null : (predicates.find((predicate) => predicate.id === search.selected) ?? null)

  function step(by: number): void {
    if (predicates.length === 0) {
      return
    }

    const at = predicates.findIndex((predicate) => predicate.id === selected?.id)
    const next =
      predicates[at === -1 ? (by > 0 ? 0 : predicates.length - 1) : (at + by + predicates.length) % predicates.length]

    if (next !== undefined) {
      setReport(null)
      onSearch({ selected: next.id })
    }
  }

  usePageKeys(
    {
      j: () => step(1),
      k: () => step(-1),
      n: () => {
        setReport(null)
        onSearch({ creating: true })
      },
      w: selected === null ? null : () => setWithdrawRequest((count) => count + 1)
    },
    listing.data !== undefined
  )

  function done(next: PredicateReport): void {
    setReport(next)
    onSearch(next.kind === "withdrawn" ? {} : { selected: next.id })
  }

  function listBody() {
    if (listing.isPending) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["predicates.list.loading"]}
        </p>
      )
    }

    if (listing.isError && listing.data === undefined) {
      return (
        <PanelProblem
          failure={listing.error instanceof BffError ? listing.error.failure : null}
          onRetry={() => void listing.refetch()}
        />
      )
    }

    if (predicates.length === 0) {
      return <p className={styles.listState}>{text["predicates.list.empty"]}</p>
    }

    return (
      <PredicateList
        predicates={predicates}
        selected={selected?.id ?? null}
        onSelect={(id) => {
          setReport(null)
          onSearch({ selected: id })
        }}
      />
    )
  }

  function detail() {
    if (creating) {
      return (
        <m.div key="new" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
          <PredicateForm onDone={done} onCancel={() => onSearch({})} />
        </m.div>
      )
    }

    if (selected !== null) {
      return (
        <m.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
          <PredicateDetail key={selected.id} predicate={selected} withdrawRequest={withdrawRequest} onDone={done} />
        </m.div>
      )
    }

    return (
      <div className={styles.idle}>
        <SealCheck aria-hidden="true" size={28} />
        <p className={styles.idleTitle}>{text["predicates.idle.title"]}</p>
        <p className={styles.idleBody}>{text["predicates.idle.body"]}</p>
      </div>
    )
  }

  const registry = listing.data?.registry

  return (
    <>
      <PageHeader
        eyebrow={text["predicates.eyebrow"]}
        title={text["predicates.title"]}
        lead={text["predicates.lead"]}
        actions={
          <Button
            isDisabled={creating}
            onPress={() => {
              setReport(null)
              onSearch({ creating: true })
            }}
          >
            <Plus aria-hidden="true" />
            {text["predicates.new"]}
          </Button>
        }
      />
      {predicates.length === 0 ? null : (
        <KeyHints
          label={text["predicates.keys.label"]}
          hints={[
            { keys: ["J", "K"], label: text["predicates.keys.move"] },
            { keys: ["N"], label: text["predicates.keys.new"] },
            { keys: ["W"], label: text["predicates.keys.withdraw"] }
          ]}
        />
      )}
      <div className={styles.workspace}>
        <section className={styles.listColumn} aria-labelledby="predicates-title" aria-busy={listing.isFetching}>
          <div className={styles.listHead}>
            <h2 id="predicates-title" className={styles.listTitle}>
              {text["predicates.list.title"]}
              {listing.data === undefined ? null : (
                <span className={styles.count}>
                  {formatText(text["predicates.list.count"], { count: numbers.format(predicates.length) })}
                </span>
              )}
            </h2>
            <IconButton
              className={styles.refresh}
              aria-label={text["predicates.refresh"]}
              onPress={() => void listing.refetch()}
            >
              <ArrowClockwise aria-hidden="true" />
            </IconButton>
          </div>
          {listing.data === undefined ? null : (
            <p className={styles.registry}>
              {registry === null || registry === undefined
                ? text["predicates.registry.none"]
                : formatText(text["predicates.registry"], { generation: numbers.format(registry.generation) })}
            </p>
          )}
          {listBody()}
        </section>
        <div className={styles.detailColumn}>
          {report === null ? null : (
            <m.div
              key={`${report.kind}-${report.id}`}
              className={styles.notice}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={enter}
            >
              <Notice tone="info">
                {formatText(text[`predicates.report.${report.kind}`], { label: report.label })}
              </Notice>
            </m.div>
          )}
          {detail()}
        </div>
      </div>
    </>
  )
}

export { PredicatesPage }
