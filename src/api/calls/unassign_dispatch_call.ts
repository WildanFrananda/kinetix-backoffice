import type { BffCall } from "../../types/bff_call.type"
import type { DispatchJob } from "../../types/dispatch_job.type"
import { jobAnswerSchema } from "../schemas/dispatch_schemas"

function unassignDispatchCall(jobId: number): BffCall<DispatchJob> {
  return {
    endpoint: "matching.unassignDispatch",
    method: "POST",
    path: `/bff/api/v1/matching/backoffice/dispatches/${jobId}/unassign`,
    schema: jobAnswerSchema
  }
}

export { unassignDispatchCall }
