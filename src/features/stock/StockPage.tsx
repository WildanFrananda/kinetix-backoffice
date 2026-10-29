import { useQuery } from "@tanstack/react-query"
import { m } from "motion/react"
import { useEffect, useRef, useState } from "react"
import { Button as IconButton } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import type { BinRequest } from "../../types/bin_request.type"
import type { StockReport } from "../../types/stock_report.type"
import type { StockSearch } from "../../types/stock_search.type"
import { Button } from "../../ui/Button"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { ArrowLeft } from "../../ui/icons/ArrowLeft"
import { ArrowRight } from "../../ui/icons/ArrowRight"
import { Plus } from "../../ui/icons/Plus"
import { Warehouse } from "../../ui/icons/Warehouse"
import { KeyHints } from "../../ui/KeyHints"
import { enter } from "../../ui/motion/motion_presets"
import { PageHeader } from "../../ui/PageHeader"
import { PanelProblem } from "../../ui/PanelProblem"
import { usePageKeys } from "../../ui/use_page_keys"
import { usePresence } from "../../ui/use_presence"
import { BinDetail } from "./BinDetail"
import { BinDialog } from "./BinDialog"
import { BinList } from "./BinList"
import { RackFigure } from "./RackFigure"
import { SkuFinder } from "./SkuFinder"
import styles from "./Stock.module.css"
import { StockNotice } from "./StockNotice"
import { binsQuery } from "./stock_queries"
import { useStockText } from "./stock_text"

function StockPage({ search, onSearch }: { search: StockSearch; onSearch: (next: StockSearch) => void }) {
  const text = useStockText()
  const poll = usePresence()
  const bins = useQuery(binsQuery(search.after, poll))
  const [report, setReport] = useState<StockReport | null>(null)
  const [creating, setCreating] = useState(false)
  const detailColumn = useRef<HTMLDivElement>(null)
  const page = bins.data?.bins
  const selected = page?.find((bin) => bin.code === search.bin) ?? null
  const [request, setRequest] = useState<BinRequest | null>(null)

  function step(by: number): void {
    if (page === undefined || page.length === 0) {
      return
    }

    const at = page.findIndex((bin) => bin.code === search.bin)
    const next = page[at === -1 ? (by > 0 ? 0 : page.length - 1) : (at + by + page.length) % page.length]
    if (next !== undefined) {
      choose(next.code)
    }
  }

  function ask(name: BinRequest["name"]): void {
    setRequest((last) => ({ name, serial: (last?.serial ?? 0) + 1 }))
  }

  usePageKeys(
    {
      j: () => step(1),
      k: () => step(-1),
      b: search.bin === undefined ? null : () => ask("receive"),
      e: search.bin === undefined ? null : () => ask("edit"),
      n: () => setCreating(true),
      "/": () => document.getElementById("sku-finder")?.focus()
    },
    bins.data !== undefined && !creating
  )

  useEffect(() => {
    if (search.bin === undefined || window.matchMedia("(min-width: 64rem)").matches) {
      return
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    detailColumn.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" })
  }, [search.bin])

  function choose(code: string): void {
    setReport(null)
    onSearch({ ...search, bin: code })
  }

  function done(next: StockReport): void {
    setReport(next)
    setCreating(false)
    onSearch({ ...search, bin: next.bin })
  }

  function listBody() {
    if (bins.isPending) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["stock.list.loading"]}
        </p>
      )
    }

    if (bins.isError && bins.data === undefined) {
      return (
        <PanelProblem
          failure={bins.error instanceof BffError ? bins.error.failure : null}
          onRetry={() => void bins.refetch()}
        />
      )
    }

    if (page === undefined || page.length === 0) {
      return <p className={styles.listState}>{text["stock.list.empty"]}</p>
    }

    return <BinList bins={page} selected={selected?.code ?? null} onSelect={choose} />
  }

  const nextAfter = bins.data?.nextAfter ?? null

  return (
    <>
      <PageHeader
        eyebrow={text["stock.eyebrow"]}
        title={text["stock.title"]}
        lead={text["stock.lead"]}
        actions={
          <Button onPress={() => setCreating(true)}>
            <Plus aria-hidden="true" />
            {text["stock.newBin"]}
          </Button>
        }
      />
      <div className={styles.desk}>
        <SkuFinder
          sku={search.sku}
          poll={poll}
          hints={
            <KeyHints
              label={text["stock.keys.label"]}
              hints={[
                { keys: ["J", "K"], label: text["stock.keys.move"] },
                { keys: ["B"], label: text["stock.keys.receive"] },
                { keys: ["E"], label: text["stock.keys.edit"] },
                { keys: ["N"], label: text["stock.keys.new"] },
                { keys: ["/"], label: text["stock.keys.find"] }
              ]}
            />
          }
          onFind={(sku) => onSearch({ ...search, sku })}
          onSelectBin={choose}
        />
        {page === undefined || page.length === 0 ? null : (
          <RackFigure key={search.after ?? ""} bins={page} selected={selected?.code ?? null} />
        )}
      </div>
      <div className={styles.workspace}>
        <section className={styles.listColumn} aria-labelledby="bins-title" aria-busy={bins.isFetching}>
          <div className={styles.listHead}>
            <h2 id="bins-title" className={styles.listTitle}>
              {text["stock.list.title"]}
            </h2>
            <IconButton
              className={styles.refresh}
              aria-label={text["stock.refresh"]}
              isDisabled={bins.isFetching}
              onPress={() => void bins.refetch()}
            >
              <ArrowClockwise aria-hidden="true" />
            </IconButton>
          </div>
          {listBody()}
          {nextAfter === null && search.after === undefined ? null : (
            <div className={styles.pager}>
              {search.after === undefined ? (
                <span />
              ) : (
                <Button variant="quiet" onPress={() => onSearch({ sku: search.sku })}>
                  <ArrowLeft aria-hidden="true" />
                  {text["stock.list.first"]}
                </Button>
              )}
              {nextAfter === null ? null : (
                <Button variant="quiet" onPress={() => onSearch({ sku: search.sku, after: nextAfter })}>
                  {text["stock.list.next"]}
                  <ArrowRight aria-hidden="true" />
                </Button>
              )}
            </div>
          )}
        </section>
        <div ref={detailColumn} className={styles.detailColumn}>
          <StockNotice report={report} />
          {search.bin === undefined ? (
            <div className={styles.idle}>
              <Warehouse aria-hidden="true" size={28} />
              <p className={styles.idleTitle}>{text["stock.idle.title"]}</p>
              <p className={styles.idleBody}>{text["stock.idle.body"]}</p>
            </div>
          ) : (
            <m.div key={search.bin} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
              <BinDetail code={search.bin} bin={selected} poll={poll} request={request} onDone={done} />
            </m.div>
          )}
        </div>
      </div>
      {creating ? <BinDialog bin={null} onClose={() => setCreating(false)} onDone={done} /> : null}
    </>
  )
}

export { StockPage }
