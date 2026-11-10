import type { DispatchJobStatus } from "./dispatch_job_status.type"

type DispatchFilter = {
  status: DispatchJobStatus | undefined
  before: number | undefined
}

export type { DispatchFilter }
