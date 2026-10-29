import { AnimatePresence, m } from "motion/react"
import { useSyncExternalStore } from "react"
import { connectivity, subscribeConnectivity } from "../../api/connectivity"
import { governor } from "../../api/governor"
import { formatDuration } from "../../i18n/format_duration"
import { formatText } from "../../i18n/format_text"
import { useText } from "../../i18n/use_text"
import type { ShellNotice } from "../../types/shell_notice.type"
import { CloudSlash } from "../icons/CloudSlash"
import { Hourglass } from "../icons/Hourglass"
import { WifiSlash } from "../icons/WifiSlash"
import { enter, exit } from "../motion/motion_presets"
import { useNow } from "../use_now"
import styles from "./ConnectivityBanner.module.css"

function ConnectivityBanner() {
  const text = useText()
  const network = useSyncExternalStore(subscribeConnectivity, connectivity, connectivity)
  const budget = useSyncExternalStore(governor.subscribe, governor.state, governor.state)
  const now = useNow(budget.heldUntil !== null)

  let message: ShellNotice | null = null

  if (!network.online) {
    message = { key: "offline", icon: WifiSlash, body: text["shell.offline"] }
  } else if (!network.reachable) {
    message = { key: "unreachable", icon: CloudSlash, body: text["shell.unreachable"] }
  } else if (budget.heldUntil !== null) {
    const time = formatDuration(budget.heldUntil - now)
    message = { key: "held", icon: Hourglass, body: formatText(text["shell.budgetHeld"], { time }) }
  }

  return (
    <div className={styles.slot} role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {message === null ? null : (
          <m.div
            key={message.key}
            className={styles.banner}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: enter }}
            exit={{ opacity: 0, y: -6, transition: exit }}
          >
            <message.icon aria-hidden="true" className={styles.icon} />
            <span>{message.body}</span>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export { ConnectivityBanner }
