import type { DispatchJob } from "./dispatch_job.type"

type DispatchPage = {
  jobs: DispatchJob[]
  nextCursor: number | null
}

export type { DispatchPage }
