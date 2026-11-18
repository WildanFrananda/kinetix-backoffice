import { queryOptions } from "@tanstack/react-query"
import { bffFetch } from "../../api/bff_fetch"
import { caseDetailCall } from "../../api/calls/case_detail_call"
import { casesCall } from "../../api/calls/cases_call"
import type { CaseStatusFilter } from "../../types/case_status_filter.type"

function casesKey(status: CaseStatusFilter) {
  return ["bff", "seal-cases", status] as const
}

function caseDetailKey(merchantId: string, status: CaseStatusFilter) {
  return ["bff", "seal-case", merchantId, status] as const
}

function casesQuery(status: CaseStatusFilter) {
  return queryOptions({
    queryKey: casesKey(status),
    queryFn: ({ signal }) => bffFetch(casesCall(status), signal)
  })
}

function caseDetailQuery(merchantId: string, status: CaseStatusFilter) {
  return queryOptions({
    queryKey: caseDetailKey(merchantId, status),
    queryFn: ({ signal }) => bffFetch(caseDetailCall(merchantId, status), signal)
  })
}

export { caseDetailKey, caseDetailQuery, casesKey, casesQuery }
