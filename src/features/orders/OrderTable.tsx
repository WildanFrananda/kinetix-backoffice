import { Link } from "@tanstack/react-router"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { OrderSummary } from "../../types/order_summary.type"
import type { OrdersSearch } from "../../types/orders_search.type"
import { inPlace } from "../../ui/in_place"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import hidden from "../../ui/VisuallyHidden.module.css"
import { rupiah } from "./money"
import styles from "./Orders.module.css"
import { orderTone } from "./order_tone"
import { useOrdersText } from "./orders_text"

function OrderTable({
  orders,
  search,
  selected
}: {
  orders: readonly OrderSummary[]
  search: OrdersSearch
  selected: string | null
}) {
  const text = useOrdersText()
  const locale = useLocale()
  const money = rupiah(locale)
  const numbers = new Intl.NumberFormat(locale)

  return (
    <div className={styles.tableFrame}>
      <table className={styles.table}>
        <caption className={hidden.hidden}>{text["orders.results.caption"]}</caption>
        <thead>
          <tr>
            <th scope="col">{text["orders.column.number"]}</th>
            <th scope="col">{text["orders.column.status"]}</th>
            <th scope="col" className={styles.number}>
              {text["orders.column.total"]}
            </th>
            <th scope="col">{text["orders.column.placed"]}</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} data-selected={order.id === selected}>
              <th scope="row">
                <Link to="/orders" search={{ ...search, order: order.id }} {...inPlace} className={styles.orderLink}>
                  {order.orderNumber}
                </Link>
                <span className={styles.meta}>
                  {formatText(text["orders.column.itemCount"], { count: numbers.format(order.itemCount) })}
                </span>
              </th>
              <td>
                <StatusTag tone={orderTone(order.status)}>{text[`orders.status.${order.status}`]}</StatusTag>
              </td>
              <td className={styles.number}>{money.format(order.finalTotal)}</td>
              <td className={styles.when}>
                <RelativeTime instant={order.createdAt} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { OrderTable }
