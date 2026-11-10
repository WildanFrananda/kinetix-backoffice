import type { BffCall } from "../../types/bff_call.type"
import type { DispatchFilter } from "../../types/dispatch_filter.type"
import type { DispatchPage } from "../../types/dispatch_page.type"
import { jobPageSchema } from "../schemas/dispatch_schemas"

const jobsPageSize = 50

function dispatchJobsCall(filter: DispatchFilter): BffCall<DispatchPage> {
  const query: Record<string, string> = { limit: String(jobsPageSize) }

  if (filter.status !== undefined) {
    query.status = filter.status
  }

  if (filter.before !== undefined) {
    query.before = String(filter.before)
  }

  return {
    endpoint: "matching.listDispatches",
    method: "GET",
    path: "/bff/api/v1/matching/backoffice/dispatches",
    query,
    schema: jobPageSchema
  }
}

export { dispatchJobsCall, jobsPageSize }
