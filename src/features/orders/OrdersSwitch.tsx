import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { queuePageSize } from "../../api/queue_page"
import { useLocale } from "../../i18n/use_locale"
import { ArrowUUpLeft } from "../../ui/icons/ArrowUUpLeft"
import { LinkBreak } from "../../ui/icons/LinkBreak"
import { Receipt } from "../../ui/icons/Receipt"
import { sagasQuery } from "../overview/overview_queries"
import styles from "./Orders.module.css"
import { attentionReturnsQuery } from "./orders_queries"
import { useOrdersText } from "./orders_text"

function countOf(count: number | undefined, more: boolean, numbers: Intl.NumberFormat): string {
  if (count === undefined) {
    return "—"
  }

  return `${numbers.format(count)}${more ? "+" : ""}`
}

function OrdersSwitch({ screen, poll }: { screen: "orders" | "sagas" | "returns"; poll: boolean }) {
  const text = useOrdersText()
  const numbers = new Intl.NumberFormat(useLocale())
  const sagas = useQuery(sagasQuery(poll))
  const returns = useQuery(attentionReturnsQuery())
  const returnCount = returns.data?.length

  return (
    <nav aria-label={text["orders.switch"]}>
      <p className={styles.switchLabel} aria-hidden="true">
        {text["orders.switch"]}
      </p>
      <div className={styles.switches}>
        <Link
          to="/orders"
          className={styles.switchLink}
          aria-current={screen === "orders" ? "page" : undefined}
          activeOptions={{ exact: true, includeSearch: false }}
        >
          <Receipt aria-hidden="true" className={styles.switchIcon} />
          <span className={styles.switchName}>{text["orders.switch.orders"]}</span>
        </Link>
        <Link
          to="/orders/sagas"
          className={styles.switchLink}
          aria-current={screen === "sagas" ? "page" : undefined}
          activeOptions={{ exact: true, includeSearch: false }}
        >
          <LinkBreak aria-hidden="true" className={styles.switchIcon} />
          <span className={styles.switchName}>{text["orders.switch.sagas"]}</span>
          <span className={styles.switchCount}>{countOf(sagas.data, false, numbers)}</span>
        </Link>
        <Link
          to="/orders/returns"
          className={styles.switchLink}
          aria-current={screen === "returns" ? "page" : undefined}
          activeOptions={{ exact: true, includeSearch: false }}
        >
          <ArrowUUpLeft aria-hidden="true" className={styles.switchIcon} />
          <span className={styles.switchName}>{text["orders.switch.returns"]}</span>
          <span className={styles.switchCount}>
            {countOf(returnCount, (returnCount ?? 0) >= queuePageSize, numbers)}
          </span>
        </Link>
      </div>
    </nav>
  )
}

export { OrdersSwitch }
