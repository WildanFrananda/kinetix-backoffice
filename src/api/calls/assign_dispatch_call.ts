import type { BffCall } from "../../types/bff_call.type"
import type { DispatchJob } from "../../types/dispatch_job.type"
import { jobAnswerSchema } from "../schemas/dispatch_schemas"

function assignDispatchCall(jobId: number, courierId: number): BffCall<DispatchJob> {
  return {
    endpoint: "matching.assignDispatch",
    method: "POST",
    path: `/bff/api/v1/matching/backoffice/dispatches/${jobId}/assign`,
    body: { driver_id: courierId },
    schema: jobAnswerSchema
  }
}

export { assignDispatchCall }
