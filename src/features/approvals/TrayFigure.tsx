import { Tray } from "@phosphor-icons/react"
import { useLocale } from "../../i18n/use_locale"
import type { TrayModel } from "../../types/tray_model.type"
import { Drawing } from "../../ui/drawing/Drawing"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"

function TrayFigure({
  model,
  waiting,
  approved,
  rejected,
  canReject
}: {
  model: TrayModel
  waiting: string
  approved: number
  rejected: number
  canReject: boolean
}) {
  const text = useApprovalsText()
  const numbers = new Intl.NumberFormat(useLocale())

  return (
    <figure className={styles.figure}>
      <Drawing
        model={model}
        media="(min-width: 64rem)"
        className={styles.drawing}
        fallback={<Tray size={56} weight="thin" />}
      />
      <dl className={styles.legend} data-columns={canReject ? 3 : 2}>
        <div>
          <dt>{text["approvals.tray.waiting"]}</dt>
          <dd data-tone="attention">{waiting}</dd>
        </div>
        <div>
          <dt>{text["approvals.tray.approved"]}</dt>
          <dd>{numbers.format(approved)}</dd>
        </div>
        {canReject ? (
          <div>
            <dt>{text["approvals.tray.rejected"]}</dt>
            <dd>{numbers.format(rejected)}</dd>
          </div>
        ) : null}
      </dl>
    </figure>
  )
}

export { TrayFigure }
