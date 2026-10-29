import { Moped, Storefront } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { useLocale } from "../../i18n/use_locale"
import type { ApprovalQueue } from "../../types/approval_queue.type"
import { courierApplicationsQuery, sellerApplicationsQuery } from "../overview/overview_queries"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"

function countOf(data: { count: number; more: boolean } | undefined, numbers: Intl.NumberFormat): string {
  if (data === undefined) {
    return "—"
  }

  return `${numbers.format(data.count)}${data.more ? "+" : ""}`
}

function QueueSwitch({ queue, poll }: { queue: ApprovalQueue; poll: boolean }) {
  const text = useApprovalsText()
  const numbers = new Intl.NumberFormat(useLocale())
  const sellers = useQuery(sellerApplicationsQuery(poll))
  const couriers = useQuery(courierApplicationsQuery(poll))

  return (
    <nav aria-label={text["approvals.queues"]}>
      <p className={styles.label} aria-hidden="true">
        {text["approvals.queues"]}
      </p>
      <div className={styles.queues}>
        <Link
          to="/approvals/sellers"
          className={styles.queue}
          aria-current={queue === "sellers" ? "page" : undefined}
          activeOptions={{ exact: true, includeSearch: false }}
        >
          <Storefront aria-hidden="true" className={styles.queueIcon} />
          <span className={styles.queueName}>{text["approvals.queue.sellers"]}</span>
          <span className={styles.queueCount}>{countOf(sellers.data, numbers)}</span>
        </Link>
        <Link
          to="/approvals/couriers"
          className={styles.queue}
          aria-current={queue === "couriers" ? "page" : undefined}
          activeOptions={{ exact: true, includeSearch: false }}
        >
          <Moped aria-hidden="true" className={styles.queueIcon} />
          <span className={styles.queueName}>{text["approvals.queue.couriers"]}</span>
          <span className={styles.queueCount}>{countOf(couriers.data, numbers)}</span>
        </Link>
      </div>
    </nav>
  )
}

export { QueueSwitch }
