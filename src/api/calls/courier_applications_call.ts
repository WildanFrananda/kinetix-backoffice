import * as v from "valibot"
import type { ApplicationPage } from "../../types/application_page.type"
import type { BffCall } from "../../types/bff_call.type"
import type { CourierApplication } from "../../types/courier_application.type"
import { queuePageSize } from "../queue_page"
import { courierApplicationSchema } from "../schemas/application_schemas"

const pageSchema = v.object({
  applications: v.array(courierApplicationSchema),
  nextAfterId: v.nullable(v.number())
})

function courierApplicationsCall(filter: {
  status: CourierApplication["status"]
  after: number
}): BffCall<ApplicationPage<CourierApplication>> {
  return {
    endpoint: "identity.listCourierApplications",
    method: "GET",
    path: "/bff/api/v1/couriers/applications",
    query: { status: filter.status, limit: String(queuePageSize), after: String(filter.after) },
    schema: pageSchema
  }
}

export { courierApplicationsCall }
