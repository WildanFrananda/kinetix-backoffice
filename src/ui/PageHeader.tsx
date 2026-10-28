import { type ReactNode, useEffect } from "react"
import { useText } from "../i18n/use_text"
import styles from "./PageHeader.module.css"

function PageHeader({
  eyebrow,
  title,
  lead,
  actions
}: {
  eyebrow: string
  title: string
  lead?: string
  actions?: ReactNode
}) {
  const text = useText()

  useEffect(() => {
    document.title = `${title} · Kinetix ${text["app.name"]}`
  }, [title, text])

  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title} tabIndex={-1} data-page-title>
          {title}
        </h1>
        {lead === undefined ? null : <p className={styles.lead}>{lead}</p>}
      </div>
      {actions === undefined ? null : <div className={styles.actions}>{actions}</div>}
    </header>
  )
}

export { PageHeader }
