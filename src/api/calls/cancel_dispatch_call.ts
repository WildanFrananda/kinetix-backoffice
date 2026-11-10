import type { BffCall } from "../../types/bff_call.type"
import type { DispatchJob } from "../../types/dispatch_job.type"
import { jobAnswerSchema } from "../schemas/dispatch_schemas"

function cancelDispatchCall(jobId: number): BffCall<DispatchJob> {
  return {
    endpoint: "matching.cancelDispatch",
    method: "POST",
    path: `/bff/api/v1/matching/backoffice/dispatches/${jobId}/cancel`,
    schema: jobAnswerSchema
  }
}

export { cancelDispatchCall }
