import { Tray } from "@phosphor-icons/react"
import { useLocale } from "../../i18n/use_locale"
import type { DecisionOutcome } from "../../types/decision_outcome.type"
import type { PeriodTally } from "../../types/period_tally.type"
import type { TrayModel } from "../../types/tray_model.type"
import { Drawing } from "../../ui/drawing/Drawing"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"

const outcomes = ["approved", "rejected"] as const satisfies readonly DecisionOutcome[]

function TrayFigure({
  model,
  waiting,
  periods
}: {
  model: TrayModel
  waiting: string
  periods: readonly PeriodTally[]
}) {
  const text = useApprovalsText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const day = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" })

  return (
    <figure className={styles.figure}>
      <Drawing
        model={model}
        media="(min-width: 64rem)"
        className={styles.drawing}
        fallback={<Tray size={56} weight="thin" />}
      />
      <div className={styles.legend}>
        <dl className={styles.waiting}>
          <dt>{text["approvals.tray.waiting"]}</dt>
          <dd>{waiting}</dd>
        </dl>
        <table className={styles.tally}>
          <caption>{text["approvals.tally.caption"]}</caption>
          <thead>
            <tr>
              <td />
              {periods.map((row) => (
                <th key={row.period} scope="col">
                  {text[`approvals.tally.${row.period}`]}
                  <span className={styles.tallySince}>{day.format(row.since)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {outcomes.map((outcome) => (
              <tr key={outcome}>
                <th scope="row">{text[`approvals.tally.${outcome}`]}</th>
                {periods.map((row) => (
                  <td key={row.period}>{row.tally === undefined ? "—" : numbers.format(row.tally[outcome])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}

export { TrayFigure }
