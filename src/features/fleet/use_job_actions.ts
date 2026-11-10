import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { BffError } from "../../api/bff_error"
import { bffRequest } from "../../api/bff_request"
import { assignDispatchCall } from "../../api/calls/assign_dispatch_call"
import { cancelDispatchCall } from "../../api/calls/cancel_dispatch_call"
import { unassignDispatchCall } from "../../api/calls/unassign_dispatch_call"
import { outcomeUnknown } from "../../api/outcome_unknown"
import { formatText } from "../../i18n/format_text"
import type { DispatchJob } from "../../types/dispatch_job.type"
import type { FailureExplanation } from "../../types/failure_explanation.type"
import type { FleetCatalogue } from "../../types/fleet_catalogue.type"
import type { JobAction } from "../../types/job_action.type"
import type { JobReport } from "../../types/job_report.type"
import { jobKey, jobQuery, jobsKey } from "./fleet_queries"
import { patchJob, refreshBoard, storeJob } from "./job_cache"
import { jobFailure } from "./job_failure"

type ActionState = {
  jobId: number
  asked: JobAction | null
  report: JobReport | null
  problem: FailureExplanation | null
}

async function send({ action, jobId }: { action: JobAction; jobId: number }): Promise<DispatchJob> {
  const call =
    action.kind === "assign"
      ? assignDispatchCall(jobId, action.courierId)
      : action.kind === "unassign"
        ? unassignDispatchCall(jobId)
        : cancelDispatchCall(jobId)

  const result = await bffRequest(call)

  if (!result.ok) {
    throw new BffError(result.failure)
  }

  return result.value
}

function made(action: JobAction, job: DispatchJob): boolean {
  if (action.kind === "assign") {
    return job.status === "assigned" && job.courierId === action.courierId
  }

  return job.status === (action.kind === "unassign" ? "pending" : "cancelled")
}

function guess(action: JobAction, job: DispatchJob): DispatchJob {
  if (action.kind === "assign") {
    return { ...job, status: "assigned", courierId: action.courierId }
  }

  return { ...job, status: "pending", courierId: null, assignedAt: null }
}

function doneText(action: JobAction, job: DispatchJob, text: FleetCatalogue): string {
  const values = { job: String(job.id), courier: action.kind === "cancel" ? "" : String(action.courierId) }

  if (action.kind === "assign") {
    return formatText(text["dispatch.report.assigned"], values)
  }

  return formatText(
    text[action.kind === "unassign" ? "dispatch.report.unassigned" : "dispatch.report.cancelled"],
    values
  )
}

function useJobActions(jobId: number, text: FleetCatalogue) {
  const client = useQueryClient()
  const mutation = useMutation({ mutationFn: send })
  const [state, setState] = useState<ActionState>({ jobId, asked: null, report: null, problem: null })
  const current = state.jobId === jobId ? state : { jobId, asked: null, report: null, problem: null }

  if (state.jobId !== jobId) {
    setState(current)
  }

  function update(change: Partial<Omit<ActionState, "jobId">>): void {
    setState((last) => (last.jobId === jobId ? { ...last, ...change } : last))
  }

  async function reread(): Promise<DispatchJob | null | undefined> {
    try {
      return await client.fetchQuery({ ...jobQuery(jobId), staleTime: 0 })
    } catch {
      return undefined
    }
  }

  async function recover(error: unknown, action: JobAction, rollback: () => void): Promise<void> {
    const failure = error instanceof BffError ? error.failure : null

    if (failure === null || failure.kind === "signed-out" || failure.kind === "role-refused") {
      rollback()
      update({ asked: null, report: null })

      return
    }

    if (outcomeUnknown(failure)) {
      const fresh = await reread()

      if (fresh !== undefined && fresh !== null && made(action, fresh)) {
        storeJob(client, fresh)
        refreshBoard(client)
        update({
          asked: null,
          problem: null,
          report: { tone: "done", text: `${text["dispatch.report.madeAfterAll"]} ${doneText(action, fresh, text)}` }
        })

        return
      }

      rollback()

      if (fresh === undefined) {
        update({
          asked: null,
          problem: null,
          report: { tone: "problem", text: text["dispatch.report.unread"], quote: null, retry: null, readAgain: true }
        })

        return
      }

      if (fresh !== null) {
        storeJob(client, fresh)
      }

      refreshBoard(client)
      update({
        asked: null,
        problem: null,
        report: {
          tone: "problem",
          text: text["dispatch.report.unchanged"],
          quote: null,
          retry: action,
          readAgain: false
        }
      })

      return
    }

    rollback()

    const explanation = jobFailure(failure, action, text)

    if (failure.kind === "refused" && (failure.status === 404 || failure.status === 409)) {
      void client.invalidateQueries({ queryKey: jobKey(jobId) })
      void client.invalidateQueries({ queryKey: jobsKey })
    }

    if (action.kind === "cancel") {
      update({ problem: explanation })

      return
    }

    update({
      report: { tone: "problem", text: explanation.lead, quote: explanation.quote, retry: null, readAgain: false }
    })
  }

  async function confirm(): Promise<void> {
    const action = current.asked
    if (action === null || mutation.isPending) {
      return
    }

    if (action.kind === "cancel") {
      update({ problem: null })

      try {
        const done = await mutation.mutateAsync({ action, jobId })
        storeJob(client, done)
        refreshBoard(client)
        update({ asked: null, report: { tone: "done", text: doneText(action, done, text) } })
      } catch (error) {
        await recover(error, action, () => undefined)
      }

      return
    }

    const values = { job: String(jobId), courier: String(action.courierId) }
    const working = action.kind === "assign" ? "dispatch.report.assigning" : "dispatch.report.unassigning"

    update({ asked: null, report: { tone: "working", text: formatText(text[working], values) } })
    await client.cancelQueries({ queryKey: jobKey(jobId) })

    const rollback = patchJob(client, jobId, (job) => guess(action, job))

    try {
      const done = await mutation.mutateAsync({ action, jobId })
      storeJob(client, done)
      refreshBoard(client)
      update({ report: { tone: "done", text: doneText(action, done, text) } })
    } catch (error) {
      await recover(error, action, rollback)
    }
  }

  function readAgain(): void {
    update({ report: null })
    void client.invalidateQueries({ queryKey: jobKey(jobId) })
    void client.invalidateQueries({ queryKey: jobsKey })
  }

  return {
    asked: current.asked,
    report: current.report,
    problem: current.problem,
    cancelling: mutation.isPending && current.asked?.kind === "cancel",
    busy: mutation.isPending,
    ask(action: JobAction): void {
      update({ asked: action, problem: null })
    },
    dismiss(): void {
      update({ asked: null, problem: null })
    },
    confirm,
    readAgain
  }
}

export { useJobActions }
