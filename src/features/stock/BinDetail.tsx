import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { BinRequest } from "../../types/bin_request.type"
import type { StockReport } from "../../types/stock_report.type"
import type { StockRow } from "../../types/stock_row.type"
import type { WarehouseBin } from "../../types/warehouse_bin.type"
import { Button } from "../../ui/Button"
import { ArrowRight } from "../../ui/icons/ArrowRight"
import { Package } from "../../ui/icons/Package"
import { Warehouse } from "../../ui/icons/Warehouse"
import { PanelProblem } from "../../ui/PanelProblem"
import { BinDialog } from "./BinDialog"
import { binSummary } from "./counted"
import { LedgerList } from "./LedgerList"
import { MovementDialog } from "./MovementDialog"
import { ShelfTable } from "./ShelfTable"
import styles from "./Stock.module.css"
import { shelfQuery } from "./stock_queries"
import { useStockText } from "./stock_text"

function BinDetail({
  code,
  bin,
  poll,
  request,
  onDone
}: {
  code: string
  bin: WarehouseBin | null
  poll: boolean
  request: BinRequest | null
  onDone: (report: StockReport) => void
}) {
  const text = useStockText()
  const numbers = new Intl.NumberFormat(useLocale())
  const [after, setAfter] = useState<number | undefined>(undefined)
  const [moving, setMoving] = useState<{ row: StockRow | null } | null>(null)
  const [editing, setEditing] = useState(false)
  const shelf = useQuery(shelfQuery({ binCode: code }, after, poll))
  const firstRow = shelf.data?.rows[0]
  const place = bin ?? (firstRow === undefined ? null : { zone: firstRow.zone, shelfLevel: firstRow.shelfLevel })

  useEffect(() => {
    if (request?.name === "receive") {
      setMoving({ row: null })
    }

    if (request?.name === "edit") {
      setEditing(true)
    }
  }, [request])

  function shelfBody() {
    if (shelf.isPending) {
      return <p className={styles.listState}>{text["stock.detail.loading"]}</p>
    }

    if (shelf.isError) {
      return (
        <PanelProblem
          failure={shelf.error instanceof BffError ? shelf.error.failure : null}
          onRetry={() => void shelf.refetch()}
        />
      )
    }

    if (shelf.data.rows.length === 0 && after === undefined) {
      return <p className={styles.listState}>{text["stock.detail.emptyShelf"]}</p>
    }

    return <ShelfTable rows={shelf.data.rows} onAdjust={(row) => setMoving({ row })} />
  }

  const next = shelf.data?.nextAfterId ?? null

  return (
    <article className={styles.detail} aria-labelledby="bin-title">
      <header className={styles.detailHead}>
        <p className={styles.kicker}>
          <Warehouse aria-hidden="true" />
          {text["stock.detail.kicker"]}
        </p>
        <h2 id="bin-title" className={styles.detailTitle}>
          {code}
        </h2>
        <p className={styles.detailLead}>
          {place === null
            ? null
            : formatText(text["stock.bin.place"], { zone: place.zone, level: String(place.shelfLevel) })}
          {bin === null ? null : ` · ${binSummary(text, bin.skuCount, bin.quantity, numbers)}`}
        </p>
        <div className={styles.detailActions}>
          <Button onPress={() => setMoving({ row: null })}>
            <Package aria-hidden="true" />
            {text["stock.detail.receive"]}
          </Button>
          <Button variant="secondary" isDisabled={place === null} onPress={() => setEditing(true)}>
            {text["stock.detail.edit"]}
          </Button>
        </div>
      </header>
      <section className={styles.section} aria-labelledby="shelf-title">
        <h3 id="shelf-title" className={styles.sectionTitle}>
          {text["stock.detail.shelf"]}
        </h3>
        {shelfBody()}
        {next === null && after === undefined ? null : (
          <div className={styles.pager}>
            {after === undefined ? (
              <span />
            ) : (
              <Button variant="quiet" onPress={() => setAfter(undefined)}>
                {text["stock.list.first"]}
              </Button>
            )}
            {next === null ? null : (
              <Button variant="quiet" onPress={() => setAfter(next)}>
                {text["stock.detail.more"]}
                <ArrowRight aria-hidden="true" />
              </Button>
            )}
          </div>
        )}
      </section>
      <section className={styles.section} aria-labelledby="ledger-title">
        <h3 id="ledger-title" className={styles.sectionTitle}>
          {text["stock.ledger.title"]}
        </h3>
        <div className={styles.ledgers}>
          <LedgerList kind="receipts" binCode={code} />
          <LedgerList kind="adjustments" binCode={code} />
        </div>
      </section>
      {moving === null ? null : (
        <MovementDialog
          binCode={code}
          row={moving.row}
          onClose={() => setMoving(null)}
          onDone={(report) => {
            setMoving(null)
            onDone(report)
          }}
        />
      )}
      {editing && place !== null ? (
        <BinDialog
          bin={{ code, zone: place.zone, shelfLevel: place.shelfLevel }}
          onClose={() => setEditing(false)}
          onDone={(report) => {
            setEditing(false)
            onDone(report)
          }}
        />
      ) : null}
    </article>
  )
}

export { BinDetail }
