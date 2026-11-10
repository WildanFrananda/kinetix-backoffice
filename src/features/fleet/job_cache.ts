import type { QueryClient } from "@tanstack/react-query"
import type { DispatchJob } from "../../types/dispatch_job.type"
import type { DispatchPage } from "../../types/dispatch_page.type"
import { overviewKey } from "../overview/overview_queries"
import { fleetKey, jobKey, jobsKey } from "./fleet_queries"

function replaceIn(page: DispatchPage | undefined, id: number, change: (job: DispatchJob) => DispatchJob) {
  if (page === undefined) {
    return page
  }

  return { ...page, jobs: page.jobs.map((job) => (job.id === id ? change(job) : job)) }
}

function patchJob(client: QueryClient, id: number, change: (job: DispatchJob) => DispatchJob): () => void {
  const detail = client.getQueryData<DispatchJob | null>(jobKey(id))
  const pages = client.getQueriesData<DispatchPage>({ queryKey: jobsKey })

  client.setQueryData<DispatchJob | null>(jobKey(id), (job) => (job === undefined || job === null ? job : change(job)))
  client.setQueriesData<DispatchPage>({ queryKey: jobsKey }, (page) => replaceIn(page, id, change))

  return () => {
    client.setQueryData(jobKey(id), detail)

    for (const [key, page] of pages) {
      client.setQueryData(key, page)
    }
  }
}

function storeJob(client: QueryClient, job: DispatchJob): void {
  client.setQueryData<DispatchJob | null>(jobKey(job.id), (known) =>
    known === undefined || known === null ? job : { ...job, proof: job.proof ?? known.proof }
  )

  client.setQueriesData<DispatchPage>({ queryKey: jobsKey }, (page) => replaceIn(page, job.id, () => job))
}

function refreshBoard(client: QueryClient): void {
  void client.invalidateQueries({ queryKey: jobsKey })
  void client.invalidateQueries({ queryKey: [...overviewKey, "dispatch"] })
  void client.invalidateQueries({ queryKey: [...fleetKey, "couriers"] })
  void client.invalidateQueries({ queryKey: [...fleetKey, "courier"] })
  void client.invalidateQueries({ queryKey: [...fleetKey, "nearby"] })
  void client.invalidateQueries({ queryKey: [...fleetKey, "courier-jobs"] })
}

export { patchJob, refreshBoard, storeJob }
