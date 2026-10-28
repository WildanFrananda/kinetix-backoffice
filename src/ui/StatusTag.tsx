import type { ReactNode } from "react"
import styles from "./StatusTag.module.css"

function StatusTag({ tone, children }: { tone: "neutral" | "attention" | "settled"; children: ReactNode }) {
  return (
    <span className={styles.tag} data-tone={tone}>
      {children}
    </span>
  )
}

export { StatusTag }
