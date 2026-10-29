import * as v from "valibot"
import type { ApplicationPage } from "../../types/application_page.type"
import type { BffCall } from "../../types/bff_call.type"
import type { SellerApplication } from "../../types/seller_application.type"
import { queuePageSize } from "../queue_page"
import { sellerApplicationSchema } from "../schemas/application_schemas"

const pageSchema = v.object({
  applications: v.array(sellerApplicationSchema),
  nextAfterId: v.nullable(v.number())
})

function sellerApplicationsCall(filter: {
  status: SellerApplication["status"]
  after: number
}): BffCall<ApplicationPage<SellerApplication>> {
  return {
    endpoint: "identity.listSellerApplications",
    method: "GET",
    path: "/bff/api/v1/sellers/applications",
    query: { status: filter.status, limit: String(queuePageSize), after: String(filter.after) },
    schema: pageSchema
  }
}

export { sellerApplicationsCall }
