import { type ErrorComponentProps, useRouter } from "@tanstack/react-router"
import { BffError } from "../api/bff_error"
import { failureText } from "../i18n/failure_text"
import { formatText } from "../i18n/format_text"
import { useText } from "../i18n/use_text"
import { Button } from "./Button"
import styles from "./NotFoundPage.module.css"

function ErrorPage({ error }: ErrorComponentProps) {
  const text = useText()
  const router = useRouter()
  const message =
    error instanceof BffError
      ? failureText(error.failure, text)
      : formatText(text["failure.unexpected"], { reference: error instanceof Error ? error.name : "unknown" })

  return (
    <section className={styles.page} role="alert">
      <h1 className={styles.title}>{text["error.title"]}</h1>
      <p className={styles.body}>{message}</p>
      <Button variant="secondary" onPress={() => void router.invalidate()}>
        {text["error.retry"]}
      </Button>
    </section>
  )
}

export { ErrorPage }
