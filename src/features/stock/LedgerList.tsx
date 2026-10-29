import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { LedgerEntry } from "../../types/ledger_entry.type"
import { Button } from "../../ui/Button"
import { ArrowRight } from "../../ui/icons/ArrowRight"
import { PanelProblem } from "../../ui/PanelProblem"
import { RelativeTime } from "../../ui/RelativeTime"
import styles from "./Stock.module.css"
import { shortPrincipal } from "./short_principal"
import { ledgerQuery } from "./stock_queries"
import { useStockText } from "./stock_text"

function signed(value: number, numbers: Intl.NumberFormat): string {
  return value > 0 ? `+${numbers.format(value)}` : numbers.format(value)
}

function LedgerList({ kind, binCode }: { kind: "receipts" | "adjustments"; binCode: string }) {
  const text = useStockText()
  const numbers = new Intl.NumberFormat(useLocale())
  const [before, setBefore] = useState<number | undefined>(undefined)
  const page = useQuery(ledgerQuery(kind, { binCode }, before))
  const title = text[kind === "receipts" ? "stock.ledger.receipts" : "stock.ledger.adjustments"]

  function line(entry: LedgerEntry): string {
    if (entry.kind === "receipt") {
      return formatText(text["stock.ledger.receiptLine"], { delta: signed(entry.delta, numbers), sku: entry.sku })
    }

    return formatText(text["stock.ledger.adjustmentLine"], {
      delta: signed(entry.delta, numbers),
      sku: entry.sku,
      before: numbers.format(entry.before),
      after: numbers.format(entry.after)
    })
  }

  function body() {
    if (page.isPending) {
      return <p className={styles.listState}>{text["stock.detail.loading"]}</p>
    }

    if (page.isError) {
      return (
        <PanelProblem
          failure={page.error instanceof BffError ? page.error.failure : null}
          onRetry={() => void page.refetch()}
        />
      )
    }

    if (page.data.entries.length === 0) {
      return (
        <p className={styles.listState}>
          {text[kind === "receipts" ? "stock.ledger.noReceipts" : "stock.ledger.noAdjustments"]}
        </p>
      )
    }

    return (
      <ol className={styles.ledger}>
        {page.data.entries.map((entry) => (
          <li key={entry.id} className={styles.entry} data-direction={entry.delta < 0 ? "out" : "in"}>
            <span className={styles.entryLine}>{line(entry)}</span>
            {entry.kind === "adjustment" ? (
              <span className={styles.entryReason}>{text[`stock.reason.${entry.reason}`]}</span>
            ) : null}
            <span className={styles.entryMeta}>
              <RelativeTime instant={entry.createdAt} /> ·{" "}
              {formatText(text["stock.ledger.by"], { actor: shortPrincipal(entry.actorPrincipalId) })}
            </span>
            {entry.note === null ? null : <span className={styles.entryNote}>{entry.note}</span>}
          </li>
        ))}
      </ol>
    )
  }

  const next = page.data?.nextBeforeId ?? null

  return (
    <section className={styles.ledgerColumn} aria-label={title}>
      <h4 className={styles.ledgerTitle}>{title}</h4>
      {body()}
      {next === null && before === undefined ? null : (
        <div className={styles.pager}>
          {before === undefined ? (
            <span />
          ) : (
            <Button variant="quiet" onPress={() => setBefore(undefined)}>
              {text["stock.ledger.newest"]}
            </Button>
          )}
          {next === null ? null : (
            <Button variant="quiet" onPress={() => setBefore(next)}>
              {text["stock.ledger.older"]}
              <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </section>
  )
}

export { LedgerList }
