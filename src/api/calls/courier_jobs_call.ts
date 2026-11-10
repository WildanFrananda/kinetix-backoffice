import type { BffCall } from "../../types/bff_call.type"
import type { DispatchJob } from "../../types/dispatch_job.type"
import { jobListSchema } from "../schemas/dispatch_schemas"

function courierJobsCall(courierId: number): BffCall<DispatchJob[]> {
  return {
    endpoint: "matching.driverDispatches",
    method: "GET",
    path: `/bff/api/v1/matching/backoffice/drivers/${courierId}/dispatches`,
    schema: jobListSchema
  }
}

export { courierJobsCall }
