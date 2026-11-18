import type { BffCall } from "../../types/bff_call.type"
import type { CaseListing } from "../../types/case_listing.type"
import type { CaseStatusFilter } from "../../types/case_status_filter.type"
import { caseListingSchema } from "../schemas/case_schemas"

function casesCall(status: CaseStatusFilter = "all"): BffCall<CaseListing> {
  return {
    endpoint: "seal.listCases",
    method: "GET",
    path: "/bff/api/v1/seal/cases",
    ...(status === "all" ? {} : { query: { status } }),
    schema: caseListingSchema
  }
}

export { casesCall }
