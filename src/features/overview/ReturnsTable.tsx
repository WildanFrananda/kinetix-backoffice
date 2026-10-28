import { useText } from "../../i18n/use_text"
import type { AttentionReturn } from "../../types/attention_return.type"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Overview.module.css"

function ReturnsTable({ returns }: { returns: readonly AttentionReturn[] }) {
  const text = useText()

  return (
    <div className={styles.tableScroll}>
      <table className={styles.table}>
        <caption className={styles.caption}>{text["overview.returns.caption"]}</caption>
        <thead>
          <tr>
            <th scope="col">{text["overview.attention.return"]}</th>
            <th scope="col">{text["overview.attention.order"]}</th>
            <th scope="col">{text["overview.attention.status"]}</th>
            <th scope="col">{text["overview.attention.reason"]}</th>
            <th scope="col">{text["overview.attention.opened"]}</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((item) => (
            <tr key={item.returnNumber}>
              <td className={styles.code}>{item.returnNumber}</td>
              <td className={styles.code}>{item.orderNumber}</td>
              <td>
                <StatusTag tone={item.lastRefundError === null ? "neutral" : "attention"}>
                  {item.status.replaceAll("_", " ")}
                </StatusTag>
              </td>
              <td className={styles.reason} title={item.lastRefundError ?? item.reason}>
                {item.reason}
              </td>
              <td className={styles.when}>
                <RelativeTime instant={item.openedAt} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { ReturnsTable }
