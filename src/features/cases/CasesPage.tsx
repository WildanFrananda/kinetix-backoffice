import { useQuery } from "@tanstack/react-query"
import { m } from "motion/react"
import { useMemo } from "react"
import { Button as IconButton } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { CaseStatusFilter } from "../../types/case_status_filter.type"
import type { CasesSearch } from "../../types/cases_search.type"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { ShieldCheck } from "../../ui/icons/ShieldCheck"
import { KeyHints } from "../../ui/KeyHints"
import { enter } from "../../ui/motion/motion_presets"
import { Notice } from "../../ui/Notice"
import { PageHeader } from "../../ui/PageHeader"
import { PanelProblem } from "../../ui/PanelProblem"
import { usePageKeys } from "../../ui/use_page_keys"
import { CaseDetail } from "./CaseDetail"
import { CaseList } from "./CaseList"
import styles from "./Cases.module.css"
import { caseFailure } from "./case_failure"
import { casesQuery } from "./cases_queries"
import { useCasesText } from "./cases_text"

const statusOptions: readonly CaseStatusFilter[] = ["all", "confirmed", "submitted"]

function CasesPage({ search, onSearch }: { search: CasesSearch; onSearch: (next: CasesSearch) => void }) {
  const text = useCasesText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const activeStatus: CaseStatusFilter = search.status ?? "all"
  const listing = useQuery(casesQuery(activeStatus))
  const cases = useMemo(() => listing.data?.cases ?? [], [listing.data])
  const selected = cases.find((item) => item.merchantPrincipalId === search.selected) ?? null

  function selectCase(merchantId: string): void {
    onSearch({ selected: merchantId, status: search.status })
  }

  function step(by: number): void {
    if (cases.length === 0) {
      return
    }

    const at = cases.findIndex((item) => item.merchantPrincipalId === selected?.merchantPrincipalId)
    const next = cases[at === -1 ? (by > 0 ? 0 : cases.length - 1) : (at + by + cases.length) % cases.length]

    if (next !== undefined) {
      selectCase(next.merchantPrincipalId)
    }
  }

  usePageKeys(
    {
      j: () => step(1),
      k: () => step(-1)
    },
    listing.data !== undefined
  )

  function listBody() {
    if (listing.isPending) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["cases.list.loading"]}
        </p>
      )
    }

    if (listing.isError) {
      if (listing.error instanceof BffError) {
        const explained = caseFailure(listing.error.failure, text)

        return (
          <Notice tone="problem">
            {explained.lead}
            {explained.quote === null ? null : ` (${explained.quote})`}
          </Notice>
        )
      }

      return <PanelProblem failure={null} onRetry={() => void listing.refetch()} />
    }

    if (cases.length === 0) {
      return <p className={styles.listState}>{text["cases.list.empty"]}</p>
    }

    return <CaseList cases={cases} selected={selected?.merchantPrincipalId ?? null} onSelect={selectCase} />
  }

  function detailBody() {
    if (selected !== null) {
      return (
        <m.div
          key={`${selected.merchantPrincipalId}-${activeStatus}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={enter}
        >
          <CaseDetail merchantId={selected.merchantPrincipalId} status={activeStatus} />
        </m.div>
      )
    }

    return (
      <div className={styles.idle}>
        <ShieldCheck aria-hidden="true" size={28} />
        <p className={styles.idleTitle}>{text["cases.idle.title"]}</p>
        <p className={styles.idleBody}>{text["cases.idle.body"]}</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader eyebrow={text["cases.eyebrow"]} title={text["cases.title"]} lead={text["cases.lead"]} />
      <div className={styles.filters} role="toolbar" aria-label={text["cases.filter.label"]}>
        {statusOptions.map((option) => (
          <IconButton
            key={option}
            className={styles.filterButton}
            data-pressed={activeStatus === option ? "true" : "false"}
            aria-pressed={activeStatus === option}
            onPress={() => onSearch({ selected: search.selected, status: option === "all" ? undefined : option })}
          >
            {text[`cases.filter.${option}`]}
          </IconButton>
        ))}
      </div>
      {cases.length === 0 ? null : (
        <KeyHints label={text["cases.keys.label"]} hints={[{ keys: ["J", "K"], label: text["cases.keys.move"] }]} />
      )}
      <div className={styles.workspace}>
        <section className={styles.listColumn} aria-labelledby="cases-title" aria-busy={listing.isFetching}>
          <div className={styles.listHead}>
            <h2 id="cases-title" className={styles.listTitle}>
              {text["cases.list.title"]}
              {listing.data === undefined ? null : (
                <span className={styles.count}>
                  {formatText(text["cases.list.count"], { count: numbers.format(cases.length) })}
                </span>
              )}
            </h2>
            <IconButton
              className={styles.refresh}
              aria-label={text["cases.refresh"]}
              onPress={() => void listing.refetch()}
            >
              <ArrowClockwise aria-hidden="true" />
            </IconButton>
          </div>
          {listBody()}
        </section>
        <div className={styles.detailColumn}>{detailBody()}</div>
      </div>
    </>
  )
}

export { CasesPage }
