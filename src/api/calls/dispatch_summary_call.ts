import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"
import type { DispatchSummary } from "../../types/dispatch_summary.type"
import { countSchema } from "../schemas/count_schema"

const dispatchSummarySchema = v.pipe(
  v.object({
    data: v.object({
      pending: countSchema,
      active: countSchema,
      delivered_today: countSchema
    })
  }),
  v.transform(({ data }) => ({ pending: data.pending, active: data.active, deliveredToday: data.delivered_today }))
)

const dispatchSummaryCall: BffCall<DispatchSummary> = {
  endpoint: "matching.dispatchSummary",
  method: "GET",
  path: "/bff/api/v1/matching/backoffice/dispatches/summary",
  schema: dispatchSummarySchema
}

export { dispatchSummaryCall }
