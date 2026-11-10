import type { DispatchJobStatus } from "./dispatch_job_status.type"

type DispatchSearch = {
  status?: DispatchJobStatus | undefined
  before?: number | undefined
  job?: number | undefined
}

export type { DispatchSearch }
