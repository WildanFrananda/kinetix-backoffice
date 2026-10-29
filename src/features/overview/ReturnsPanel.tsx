import { useQuery } from "@tanstack/react-query"
import { formatText } from "../../i18n/format_text"
import { useText } from "../../i18n/use_text"
import { ArrowUUpLeft } from "../../ui/icons/ArrowUUpLeft"
import { CheckCircle } from "../../ui/icons/CheckCircle"
import { Panel } from "../../ui/Panel"
import { PanelProblem } from "../../ui/PanelProblem"
import styles from "./Overview.module.css"
import { returnsQuery } from "./overview_queries"
import { failureIn, updatedAt } from "./query_view"
import { ReturnsTable } from "./ReturnsTable"

function ReturnsPanel({ poll }: { poll: boolean }) {
  const text = useText()
  const returns = useQuery(returnsQuery(poll))

  function refresh(): void {
    void returns.refetch()
  }

  function body() {
    if (returns.isError && returns.data === undefined) {
      return <PanelProblem failure={failureIn(returns.error)} onRetry={refresh} />
    }

    if (returns.data === undefined) {
      return <p className={styles.quiet}>{text["overview.returns.loading"]}</p>
    }

    if (returns.data.count === 0) {
      return (
        <p className={styles.settled}>
          <CheckCircle aria-hidden="true" size={20} />
          {text["overview.returns.none"]}
        </p>
      )
    }

    return (
      <>
        <ReturnsTable returns={returns.data.latest} />
        {returns.data.count > returns.data.latest.length ? (
          <p className={styles.quiet}>
            {formatText(text["overview.returns.more"], { shown: String(returns.data.latest.length) })}
          </p>
        ) : null}
      </>
    )
  }

  return (
    <Panel
      id="returns"
      icon={ArrowUUpLeft}
      title={text["overview.returns.title"]}
      updatedAt={updatedAt(returns)}
      refreshing={returns.isFetching}
      onRefresh={refresh}
    >
      {body()}
    </Panel>
  )
}

export { ReturnsPanel }
