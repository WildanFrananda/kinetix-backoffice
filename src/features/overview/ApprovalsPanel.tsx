import { Stamp } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { useText } from "../../i18n/use_text"
import { Figure } from "../../ui/Figure"
import { Panel } from "../../ui/Panel"
import { PanelProblem } from "../../ui/PanelProblem"
import { relative } from "../../ui/RelativeTime"
import styles from "./Overview.module.css"
import { courierApplicationsQuery, sellerApplicationsQuery } from "./overview_queries"
import { failureIn, updatedAt } from "./query_view"

function ApprovalsPanel({ poll }: { poll: boolean }) {
  const text = useText()
  const locale = useLocale()
  const sellers = useQuery(sellerApplicationsQuery(poll))
  const couriers = useQuery(courierApplicationsQuery(poll))
  const failed = sellers.isError && sellers.data === undefined && couriers.isError && couriers.data === undefined
  const oldest = couriers.data?.oldestFiledAt ?? null

  function refresh(): void {
    void sellers.refetch()
    void couriers.refetch()
  }

  function courierNote(): string {
    if (couriers.isError) {
      return text["overview.stale"]
    }

    if (oldest === null) {
      return text["overview.approvals.couriersNote"]
    }

    return formatText(text["overview.approvals.oldest"], { time: relative(oldest.getTime() - Date.now(), locale) })
  }

  const stamps = [sellers.dataUpdatedAt, couriers.dataUpdatedAt].filter((stamp) => stamp > 0)

  return (
    <Panel
      id="approvals"
      icon={Stamp}
      title={text["overview.approvals.title"]}
      updatedAt={stamps.length === 0 ? null : updatedAt({ dataUpdatedAt: Math.min(...stamps) })}
      refreshing={sellers.isFetching || couriers.isFetching}
      onRefresh={refresh}
    >
      {failed ? (
        <PanelProblem failure={failureIn(sellers.error)} onRetry={refresh} />
      ) : (
        <dl className={styles.figures}>
          <Figure
            label={text["overview.approvals.sellers"]}
            value={sellers.data?.count ?? null}
            more={sellers.data?.more ?? false}
            tone="attention"
            note={sellers.isError ? text["overview.stale"] : text["overview.approvals.sellersNote"]}
          />
          <Figure
            label={text["overview.approvals.couriers"]}
            value={couriers.data?.count ?? null}
            more={couriers.data?.more ?? false}
            tone="attention"
            note={courierNote()}
          />
        </dl>
      )}
    </Panel>
  )
}

export { ApprovalsPanel }
