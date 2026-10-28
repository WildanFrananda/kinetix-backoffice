import { Truck } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useText } from "../../i18n/use_text"
import { Figure } from "../../ui/Figure"
import { Panel } from "../../ui/Panel"
import { PanelProblem } from "../../ui/PanelProblem"
import styles from "./Overview.module.css"
import { dispatchSummaryQuery } from "./overview_queries"
import { failureIn, updatedAt } from "./query_view"

function DispatchPanel({ poll }: { poll: boolean }) {
  const text = useText()
  const query = useQuery(dispatchSummaryQuery(poll))

  function refresh(): void {
    void query.refetch()
  }

  return (
    <Panel
      id="dispatch"
      icon={Truck}
      title={text["overview.dispatch.title"]}
      updatedAt={updatedAt(query)}
      refreshing={query.isFetching}
      onRefresh={refresh}
    >
      {query.isError && query.data === undefined ? (
        <PanelProblem failure={failureIn(query.error)} onRetry={refresh} />
      ) : (
        <dl className={styles.figures}>
          <Figure
            label={text["overview.dispatch.pending"]}
            value={query.data?.pending ?? null}
            tone="attention"
            note={text["overview.dispatch.pendingNote"]}
          />
          <Figure
            label={text["overview.dispatch.active"]}
            value={query.data?.active ?? null}
            note={text["overview.dispatch.activeNote"]}
          />
          <Figure
            label={text["overview.dispatch.delivered"]}
            value={query.data?.deliveredToday ?? null}
            note={text["overview.dispatch.deliveredNote"]}
          />
        </dl>
      )}
    </Panel>
  )
}

export { DispatchPanel }
