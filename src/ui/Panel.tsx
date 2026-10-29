import type { Icon } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { Button } from "react-aria-components"
import { formatText } from "../i18n/format_text"
import { useText } from "../i18n/use_text"
import { ArrowClockwise } from "./icons/ArrowClockwise"
import styles from "./Panel.module.css"
import { RelativeTime } from "./RelativeTime"

function Panel({
  id,
  icon: PanelIcon,
  title,
  updatedAt,
  refreshing,
  onRefresh,
  children
}: {
  id: string
  icon: Icon
  title: string
  updatedAt: Date | null
  refreshing: boolean
  onRefresh: () => void
  children: ReactNode
}) {
  const text = useText()

  return (
    <section className={styles.panel} aria-labelledby={`${id}-title`} aria-busy={refreshing}>
      <header className={styles.head}>
        <PanelIcon aria-hidden="true" className={styles.icon} />
        <h2 id={`${id}-title`} className={styles.title}>
          {title}
        </h2>
        <span className={styles.meta}>
          {updatedAt === null ? null : (
            <>
              {text["panel.updated"]} <RelativeTime instant={updatedAt} />
            </>
          )}
        </span>
        <Button
          className={styles.refresh}
          aria-label={formatText(text["panel.refresh"], { title })}
          isDisabled={refreshing}
          onPress={onRefresh}
        >
          <ArrowClockwise aria-hidden="true" className={styles.spin} data-spinning={refreshing} />
        </Button>
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  )
}

export { Panel }
