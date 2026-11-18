import type { BffCall } from "../../types/bff_call.type"
import type { CaseDetail } from "../../types/case_detail.type"
import type { CaseStatusFilter } from "../../types/case_status_filter.type"
import { caseDetailSchema } from "../schemas/case_schemas"

function caseDetailCall(merchantId: string, status: CaseStatusFilter = "all"): BffCall<CaseDetail> {
  return {
    endpoint: "seal.getCase",
    method: "GET",
    path: `/bff/api/v1/seal/cases/${merchantId}`,
    ...(status === "all" ? {} : { query: { status } }),
    schema: caseDetailSchema
  }
}

export { caseDetailCall }
