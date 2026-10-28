import * as v from "valibot"
import type { ApplicationQueue } from "../../types/application_queue.type"
import type { BffCall } from "../../types/bff_call.type"
import { queuePageSize } from "../queue_page"
import { instantSchema } from "../schemas/instant_schema"

function oldest(instants: readonly Date[]): Date | null {
  let found: Date | null = null

  for (const instant of instants) {
    if (found === null || instant.getTime() < found.getTime()) {
      found = instant
    }
  }

  return found
}

const pageSchema = v.pipe(
  v.object({
    applications: v.array(v.object({ applicationId: v.number(), status: v.string(), filedAt: instantSchema })),
    nextAfterId: v.nullable(v.number())
  }),
  v.transform(
    (page): ApplicationQueue => ({
      count: page.applications.length,
      more: page.nextAfterId !== null,
      oldestFiledAt: oldest(page.applications.map((application) => application.filedAt))
    })
  )
)

const pendingCourierApplicationsCall: BffCall<ApplicationQueue> = {
  endpoint: "identity.listCourierApplications",
  method: "GET",
  path: "/bff/api/v1/couriers/applications",
  query: { status: "pending", limit: String(queuePageSize) },
  schema: pageSchema
}

export { pendingCourierApplicationsCall }
