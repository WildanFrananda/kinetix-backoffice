import type { BffCall } from "../../types/bff_call.type"
import type { DispatchJob } from "../../types/dispatch_job.type"
import { jobAnswerSchema } from "../schemas/dispatch_schemas"

function dispatchJobCall(id: number): BffCall<DispatchJob> {
  return {
    endpoint: "matching.getDispatch",
    method: "GET",
    path: `/bff/api/v1/matching/backoffice/dispatches/${id}`,
    schema: jobAnswerSchema
  }
}

export { dispatchJobCall }
