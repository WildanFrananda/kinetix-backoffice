import { type QueryKey, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { BffError } from "../../api/bff_error"
import type { ApplicationPage } from "../../types/application_page.type"
import type { ApprovalQueue } from "../../types/approval_queue.type"
import type { DecisionKind } from "../../types/decision_kind.type"
import type { DecisionOutcome } from "../../types/decision_outcome.type"
import type { DecisionReport } from "../../types/decision_report.type"
import type { DecisionTally } from "../../types/decision_tally.type"
import type { PendingDecision } from "../../types/pending_decision.type"
import { overviewKey } from "../overview/overview_queries"
import { approvalsKey } from "./approvals_queries"
import { afterDecision, selectedIn, stepFrom } from "./queue_selection"
import { trayModel } from "./tray_model"
import { useQueueKeys } from "./use_queue_keys"

const overviewQueue = {
  sellers: "seller-applications",
  couriers: "courier-applications"
} as const satisfies Record<ApprovalQueue, string>

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function useApprovalQueue<Application>(options: {
  queue: ApprovalQueue
  listKey: QueryKey
  applications: readonly Application[] | undefined
  idOf: (application: Application) => number
  deciding: boolean
  wanted: number | undefined
  onSelect: (id: number) => void
  outcomes: readonly DecisionOutcome[]
  decide: (kind: DecisionKind, application: Application) => Promise<DecisionReport>
}) {
  const { queue, listKey, applications, idOf, deciding, wanted, onSelect, outcomes, decide } = options
  const queryClient = useQueryClient()
  const [model] = useState(() => trayModel({ reducedMotion: prefersReducedMotion(), outcomes }))
  const [asking, setAsking] = useState<PendingDecision<Application> | null>(null)
  const [open, setOpen] = useState(false)
  const [report, setReport] = useState<DecisionReport | null>(null)
  const [tally, setTally] = useState<DecisionTally>({ approved: 0, rejected: 0 })
  const ids = useMemo(() => (applications ?? []).map(idOf), [applications, idOf])
  const selectedId = selectedIn(ids, wanted)
  const selected = applications?.find((application) => idOf(application) === selectedId) ?? null

  const mutation = useMutation({
    mutationFn: (request: PendingDecision<Application>) => decide(request.kind, request.application),
    onSuccess: (result) => {
      model.decide(String(result.id), result.outcome)
      setTally((current) => ({ ...current, [result.outcome]: current[result.outcome] + 1 }))
      setReport(result)
      setOpen(false)

      const next = afterDecision(ids, result.id)
      queryClient.setQueryData<ApplicationPage<Application>>(listKey, (page) =>
        page === undefined
          ? page
          : { ...page, applications: page.applications.filter((application) => idOf(application) !== result.id) }
      )

      if (next !== null) {
        onSelect(next)
      }

      void queryClient.invalidateQueries({ queryKey: [...approvalsKey, queue] })
      void queryClient.invalidateQueries({ queryKey: [...overviewKey, overviewQueue[queue]] })
    },
    onError: (error) => {
      if (error instanceof BffError && error.failure.kind === "refused") {
        void queryClient.invalidateQueries({ queryKey: [...approvalsKey, queue] })
      }
    }
  })

  useEffect(() => {
    if (!deciding || applications === undefined) {
      return
    }

    model.show({ pending: ids.map(String), selected: selectedId === null ? null : String(selectedId) })
  }, [model, deciding, applications, ids, selectedId])

  useEffect(() => {
    if (selectedId === null) {
      return
    }

    document.querySelector(`[data-key="${selectedId}"]`)?.scrollIntoView({ block: "nearest" })
  }, [selectedId])

  function select(id: number | null): void {
    if (id !== null && id !== selectedId) {
      onSelect(id)
    }
  }

  function ask(kind: DecisionKind): void {
    if (selected === null || !deciding || mutation.isPending) {
      return
    }

    mutation.reset()
    setAsking({ kind, application: selected })
    setOpen(true)
  }

  function confirm(): void {
    if (asking !== null) {
      mutation.mutate(asking)
    }
  }

  function close(): void {
    if (!mutation.isPending) {
      setOpen(false)
    }
  }

  const canReject = outcomes.includes("rejected")

  useQueueKeys({
    enabled: !open,
    next: () => select(stepFrom(ids, selectedId, 1)),
    previous: () => select(stepFrom(ids, selectedId, -1)),
    approve: deciding && selected !== null ? () => ask("approve") : null,
    reject: deciding && canReject && selected !== null ? () => ask("reject") : null
  })

  return {
    model,
    selectedId,
    selected,
    select,
    asking,
    open,
    ask,
    confirm,
    close,
    pending: mutation.isPending,
    error: mutation.error,
    report,
    tally,
    canReject
  }
}

export { useApprovalQueue }
