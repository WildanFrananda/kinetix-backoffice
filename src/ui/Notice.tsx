import type { ReactNode } from "react"
import styles from "./Notice.module.css"

function Notice({ tone, children }: { tone: "info" | "problem"; children: ReactNode }) {
  if (tone === "problem") {
    return (
      <p className={styles.problem} role="alert">
        {children}
      </p>
    )
  }

  return (
    <p className={styles.notice} role="status">
      {children}
    </p>
  )
}

export { Notice }
