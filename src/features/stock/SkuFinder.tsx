import { useQuery } from "@tanstack/react-query"
import { type FormEvent, type ReactNode, useState } from "react"
import { Button as PlainButton } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { failureText } from "../../i18n/failure_text"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { Button } from "../../ui/Button"
import { MagnifyingGlass } from "../../ui/icons/MagnifyingGlass"
import { Notice } from "../../ui/Notice"
import { TextField } from "../../ui/TextField"
import styles from "./Stock.module.css"
import { shelfQuery } from "./stock_queries"
import { useStockText } from "./stock_text"

const skuLimit = 128

function SkuFinder({
  sku,
  poll,
  hints,
  onFind,
  onSelectBin
}: {
  sku: string | undefined
  poll: boolean
  hints: ReactNode
  onFind: (sku: string | undefined) => void
  onSelectBin: (code: string) => void
}) {
  const text = useStockText()
  const numbers = new Intl.NumberFormat(useLocale())
  const [draft, setDraft] = useState(sku ?? "")
  const [problem, setProblem] = useState<string | null>(null)
  const found = useQuery({ ...shelfQuery({ sku }, undefined, poll), enabled: sku !== undefined })

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    const wanted = draft.trim()
    if (wanted.length === 0 || [...wanted].length > skuLimit) {
      setProblem(text["stock.rule.sku"])
      return
    }

    setProblem(null)
    onFind(wanted)
  }

  function results() {
    if (sku === undefined || found.isPending) {
      return null
    }

    if (found.isError) {
      return (
        <Notice tone="problem">
          {found.error instanceof BffError ? failureText(found.error.failure, text) : text["stock.failure.refused"]}
        </Notice>
      )
    }

    if (found.data.rows.length === 0) {
      return <p className={styles.finderNone}>{formatText(text["stock.finder.none"], { sku })}</p>
    }

    return (
      <section className={styles.finderResults} aria-labelledby="finder-title">
        <h3 id="finder-title" className={styles.sectionTitle}>
          {formatText(text["stock.finder.title"], { sku })}
        </h3>
        <ul className={styles.places}>
          {found.data.rows.map((row) => (
            <li key={row.id}>
              <PlainButton className={styles.place} onPress={() => onSelectBin(row.binCode)}>
                <span className={styles.placeCode}>{row.binCode}</span>
                <span className={styles.placeCount}>
                  {formatText(text["stock.finder.place"], {
                    onHand: numbers.format(row.quantity),
                    free: numbers.format(row.available)
                  })}
                </span>
              </PlainButton>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <div className={styles.finder}>
      <search>
        <form noValidate className={styles.finderForm} onSubmit={submit}>
          <TextField
            id="sku-finder"
            label={text["stock.finder.label"]}
            value={draft}
            onChange={setDraft}
            description={text["stock.finder.placeholder"]}
            error={problem}
            validationBehavior="aria"
            autoComplete="off"
            mono
          />
          <Button type="submit" variant="secondary">
            <MagnifyingGlass aria-hidden="true" />
            {text["stock.finder.submit"]}
          </Button>
          {sku === undefined ? null : (
            <Button
              variant="quiet"
              onPress={() => {
                setDraft("")
                onFind(undefined)
              }}
            >
              {text["stock.finder.clear"]}
            </Button>
          )}
        </form>
      </search>
      {hints}
      {results()}
    </div>
  )
}

export { SkuFinder }
