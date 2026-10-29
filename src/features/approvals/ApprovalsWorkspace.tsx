import { m } from "motion/react"
import { type ReactNode, useEffect, useRef } from "react"
import { Button } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import type { ApprovalQueue } from "../../types/approval_queue.type"
import { Button as TextButton } from "../../ui/Button"
import { ArrowClockwise } from "../../ui/icons/ArrowClockwise"
import { ArrowLeft } from "../../ui/icons/ArrowLeft"
import { ArrowRight } from "../../ui/icons/ArrowRight"
import { CheckCircle } from "../../ui/icons/CheckCircle"
import { enter } from "../../ui/motion/motion_presets"
import { PanelProblem } from "../../ui/PanelProblem"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"
import { KeyHints } from "./KeyHints"
import { QueueSwitch } from "./QueueSwitch"

function ApprovalsWorkspace({
  queue,
  poll,
  filter,
  figure,
  canReject,
  listTitle,
  list,
  loading,
  error,
  empty,
  emptyText,
  refreshing,
  onRefresh,
  hasNext,
  hasPrevious,
  onNext,
  onFirst,
  notice,
  selectedKey,
  detail
}: {
  queue: ApprovalQueue
  poll: boolean
  filter: ReactNode
  figure: ReactNode
  canReject: boolean
  listTitle: string
  list: ReactNode
  loading: boolean
  error: unknown
  empty: boolean
  emptyText: string
  refreshing: boolean
  onRefresh: () => void
  hasNext: boolean
  hasPrevious: boolean
  onNext: () => void
  onFirst: () => void
  notice: ReactNode
  selectedKey: number | null
  detail: ReactNode
}) {
  const text = useApprovalsText()
  const detailColumn = useRef<HTMLDivElement>(null)
  const shownKey = useRef<number | null>(null)

  useEffect(() => {
    const previous = shownKey.current
    shownKey.current = selectedKey

    if (previous === null || selectedKey === null || previous === selectedKey) {
      return
    }

    if (window.matchMedia("(min-width: 64rem)").matches) {
      return
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    detailColumn.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" })
  }, [selectedKey])

  function listBody(): ReactNode {
    if (loading) {
      return (
        <p className={styles.listState} aria-busy="true">
          {text["approvals.list.loading"]}
        </p>
      )
    }

    if (error !== null) {
      return <PanelProblem failure={error instanceof BffError ? error.failure : null} onRetry={onRefresh} />
    }

    if (empty) {
      return (
        <p className={styles.listState}>
          <CheckCircle aria-hidden="true" size={28} />
          {emptyText}
        </p>
      )
    }

    return list
  }

  return (
    <>
      <div className={styles.desk}>
        <div className={styles.controls}>
          <QueueSwitch queue={queue} poll={poll} />
          {filter}
          <KeyHints canReject={canReject} />
        </div>
        {figure}
      </div>
      <div className={styles.workspace}>
        <section className={styles.listColumn} aria-labelledby="queue-title" aria-busy={refreshing}>
          <div className={styles.listHead}>
            <h2 id="queue-title" className={styles.listTitle}>
              {listTitle}
            </h2>
            <Button
              className={styles.refresh}
              aria-label={text["approvals.refresh"]}
              isDisabled={refreshing}
              onPress={onRefresh}
            >
              <ArrowClockwise aria-hidden="true" />
            </Button>
          </div>
          {listBody()}
          {hasNext || hasPrevious ? (
            <div className={styles.pager}>
              {hasPrevious ? (
                <TextButton variant="quiet" onPress={onFirst}>
                  <ArrowLeft aria-hidden="true" />
                  {text["approvals.first"]}
                </TextButton>
              ) : (
                <span />
              )}
              {hasNext ? (
                <TextButton variant="quiet" onPress={onNext}>
                  {text["approvals.next"]}
                  <ArrowRight aria-hidden="true" />
                </TextButton>
              ) : null}
            </div>
          ) : null}
        </section>
        <div ref={detailColumn} className={styles.detailColumn}>
          {notice}
          {selectedKey === null ? null : (
            <m.div key={selectedKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
              {detail}
            </m.div>
          )}
        </div>
      </div>
    </>
  )
}

export { ApprovalsWorkspace }
