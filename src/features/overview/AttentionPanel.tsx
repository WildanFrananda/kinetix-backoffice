import { CheckCircle, WarningDiamond } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { useText } from "../../i18n/use_text"
import { Figure } from "../../ui/Figure"
import { Panel } from "../../ui/Panel"
import { PanelProblem } from "../../ui/PanelProblem"
import styles from "./Overview.module.css"
import { returnsQuery, sagasQuery } from "./overview_queries"
import { failureIn, updatedAt } from "./query_view"

function AttentionPanel({ poll }: { poll: boolean }) {
  const text = useText()
  const sagas = useQuery(sagasQuery(poll))
  const returns = useQuery(returnsQuery(poll))
  const failed = sagas.isError && sagas.data === undefined && returns.isError && returns.data === undefined
  const stamps = [sagas.dataUpdatedAt, returns.dataUpdatedAt].filter((stamp) => stamp > 0)
  const settled = sagas.data === 0 && returns.data?.count === 0

  function refresh(): void {
    void sagas.refetch()
    void returns.refetch()
  }

  return (
    <Panel
      id="attention"
      icon={WarningDiamond}
      title={text["overview.attention.title"]}
      updatedAt={stamps.length === 0 ? null : updatedAt({ dataUpdatedAt: Math.min(...stamps) })}
      refreshing={sagas.isFetching || returns.isFetching}
      onRefresh={refresh}
    >
      {failed ? (
        <PanelProblem failure={failureIn(returns.error)} onRetry={refresh} />
      ) : (
        <>
          <dl className={styles.figures}>
            <Figure
              label={text["overview.attention.sagas"]}
              value={sagas.data ?? null}
              tone="attention"
              note={sagas.isError ? text["overview.stale"] : text["overview.attention.sagasNote"]}
            />
            <Figure
              label={text["overview.attention.returns"]}
              value={returns.data?.count ?? null}
              more={returns.data?.more ?? false}
              tone="attention"
              note={returns.isError ? text["overview.stale"] : text["overview.attention.returnsNote"]}
            />
          </dl>
          {settled ? (
            <p className={styles.settled}>
              <CheckCircle aria-hidden="true" size={20} />
              {text["overview.attention.settled"]}
            </p>
          ) : null}
        </>
      )}
    </Panel>
  )
}

export { AttentionPanel }
