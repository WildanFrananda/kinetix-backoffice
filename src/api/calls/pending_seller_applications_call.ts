import * as v from "valibot"
import type { ApplicationQueue } from "../../types/application_queue.type"
import type { BffCall } from "../../types/bff_call.type"
import { queuePageSize } from "../queue_page"

const pageSchema = v.pipe(
  v.object({
    applications: v.array(v.object({ applicationId: v.number(), status: v.string() })),
    nextAfterId: v.nullable(v.number())
  }),
  v.transform(
    (page): ApplicationQueue => ({
      count: page.applications.length,
      more: page.nextAfterId !== null,
      oldestFiledAt: null
    })
  )
)

const pendingSellerApplicationsCall: BffCall<ApplicationQueue> = {
  endpoint: "identity.listSellerApplications",
  method: "GET",
  path: "/bff/api/v1/sellers/applications",
  query: { status: "pending", limit: String(queuePageSize) },
  schema: pageSchema
}

export { pendingSellerApplicationsCall }
