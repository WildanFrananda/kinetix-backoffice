import { useQuery } from "@tanstack/react-query"
import { m } from "motion/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button as IconButton } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { CategoriesSearch } from "../../types/categories_search.type"
import type { CategoryReport } from "../../types/category_report.type"
import { Button } from "../../ui/Button"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { Plus } from "../../ui/icons/Plus"
import { Tag } from "../../ui/icons/Tag"
import { KeyHints } from "../../ui/KeyHints"
import { enter } from "../../ui/motion/motion_presets"
import { PageHeader } from "../../ui/PageHeader"
import { PanelProblem } from "../../ui/PanelProblem"
import { usePageKeys } from "../../ui/use_page_keys"
import { CabinetFigure } from "./CabinetFigure"
import styles from "./Categories.module.css"
import { CategoryEditor } from "./CategoryEditor"
import { CategoryFilter } from "./CategoryFilter"
import { CategoryList } from "./CategoryList"
import { CategoryNotice } from "./CategoryNotice"
import { cabinetShape } from "./cabinet_model"
import { categoriesQuery } from "./categories_queries"
import { useCategoriesText } from "./categories_text"
import { matchingCategories, sortedCategories } from "./category_order"

function CategoriesPage({
  search,
  onSearch
}: {
  search: CategoriesSearch
  onSearch: (next: CategoriesSearch) => void
}) {
  const text = useCategoriesText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const list = useQuery(categoriesQuery())
  const [query, setQuery] = useState("")
  const [report, setReport] = useState<CategoryReport | null>(null)
  const detailColumn = useRef<HTMLDivElement>(null)
  const categories = useMemo(() => sortedCategories(list.data ?? [], locale), [list.data, locale])
  const shown = useMemo(() => matchingCategories(categories, query, locale), [categories, query, locale])
  const creating = search.creating === true
  const selected = creating ? null : (categories.find((category) => category.id === search.selected) ?? null)
  const focus = creating ? "new" : (selected?.id ?? null)
  const [deleteRequest, setDeleteRequest] = useState(0)
  const shape = cabinetShape(categories.length)

  function step(by: number): void {
    if (shown.length === 0) {
      return
    }

    const at = shown.findIndex((category) => category.id === selected?.id)
    const next = shown[at === -1 ? (by > 0 ? 0 : shown.length - 1) : (at + by + shown.length) % shown.length]
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
      "/": () => document.getElementById("category-filter")?.focus(),
      d: selected === null ? null : () => setDeleteRequest((count) => count + 1)
    },
    list.data !== undefined
  )

  useEffect(() => {
    if (focus === null || window.matchMedia("(min-width: 64rem)").matches) {
      return
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    detailColumn.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" })
  }, [focus])

  function done(next: CategoryReport): void {
    setReport(next)
    onSearch(next.kind === "deleted" ? {} : { selected: next.id })
  }

  function listBody() {
    if (list.isPending) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["categories.list.loading"]}
        </p>
      )
    }

    if (list.isError && list.data === undefined) {
      return (
        <PanelProblem
          failure={list.error instanceof BffError ? list.error.failure : null}
          onRetry={() => void list.refetch()}
        />
      )
    }

    if (categories.length === 0) {
      return <p className={styles.listState}>{text["categories.list.empty"]}</p>
    }

    if (shown.length === 0) {
      return <p className={styles.listState}>{formatText(text["categories.list.noMatch"], { query: query.trim() })}</p>
    }

    return (
      <CategoryList
        categories={shown}
        selected={selected?.id ?? null}
        onSelect={(id) => {
          setReport(null)
          onSearch({ selected: id })
        }}
      />
    )
  }

  function detail() {
    if (creating || selected !== null) {
      return (
        <m.div key={focus} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
          <CategoryEditor
            key={focus}
            category={selected}
            deleteRequest={deleteRequest}
            onDone={done}
            onCancel={() => onSearch({})}
          />
        </m.div>
      )
    }

    return (
      <div className={styles.idle}>
        <Tag aria-hidden="true" size={28} />
        <p className={styles.idleTitle}>{text["categories.idle.title"]}</p>
        <p className={styles.idleBody}>{text["categories.idle.body"]}</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={text["categories.eyebrow"]}
        title={text["categories.title"]}
        lead={text["categories.lead"]}
        actions={
          <Button
            isDisabled={creating}
            onPress={() => {
              setReport(null)
              onSearch({ creating: true })
            }}
          >
            <Plus aria-hidden="true" />
            {text["categories.new"]}
          </Button>
        }
      />
      {categories.length === 0 ? null : (
        <div className={styles.desk}>
          <KeyHints
            label={text["categories.keys.label"]}
            hints={[
              { keys: ["J", "K"], label: text["categories.keys.move"] },
              { keys: ["N"], label: text["categories.keys.new"] },
              { keys: ["/"], label: text["categories.keys.find"] },
              { keys: ["D"], label: text["categories.keys.delete"] }
            ]}
          />
          <CabinetFigure
            key={`${shape.columns}x${shape.rows}`}
            categories={categories}
            capacity={categories.length}
            selected={selected?.id ?? null}
          />
        </div>
      )}
      <div className={styles.workspace}>
        <section className={styles.listColumn} aria-labelledby="categories-title" aria-busy={list.isFetching}>
          <div className={styles.listHead}>
            <h2 id="categories-title" className={styles.listTitle}>
              {text["categories.list.title"]}
              {list.data === undefined ? null : (
                <span className={styles.count}>
                  {formatText(text["categories.list.count"], { count: numbers.format(categories.length) })}
                </span>
              )}
            </h2>
            <IconButton
              className={styles.refresh}
              aria-label={text["categories.refresh"]}
              isDisabled={list.isFetching}
              onPress={() => void list.refetch()}
            >
              <ArrowClockwise aria-hidden="true" />
            </IconButton>
          </div>
          {categories.length > 0 ? <CategoryFilter value={query} onChange={setQuery} /> : null}
          {listBody()}
        </section>
        <div ref={detailColumn} className={styles.detailColumn}>
          <CategoryNotice report={report} />
          {detail()}
        </div>
      </div>
    </>
  )
}

export { CategoriesPage }
