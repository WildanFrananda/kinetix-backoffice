import { WarningDiamond } from "@phosphor-icons/react"
import { failureText } from "../i18n/failure_text"
import { formatText } from "../i18n/format_text"
import { useText } from "../i18n/use_text"
import type { BffFailure } from "../types/bff_failure.type"
import { Button } from "./Button"
import styles from "./PanelProblem.module.css"

function PanelProblem({ failure, onRetry }: { failure: BffFailure | null; onRetry: () => void }) {
  const text = useText()

  return (
    <div className={styles.problem} role="alert">
      <WarningDiamond aria-hidden="true" className={styles.icon} size={22} />
      <p className={styles.body}>
        {failure === null ? formatText(text["failure.unexpected"], { reference: "panel" }) : failureText(failure, text)}
      </p>
      <Button variant="secondary" onPress={onRetry}>
        {text["error.retry"]}
      </Button>
    </div>
  )
}

export { PanelProblem }
