import { queryOptions } from "@tanstack/react-query"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { bffRequest } from "../../api/bff_request"
import { applicantProfileCall } from "../../api/calls/applicant_profile_call"
import { courierApplicationsCall } from "../../api/calls/courier_applications_call"
import { sellerApplicationsCall } from "../../api/calls/seller_applications_call"
import type { ApplicantProfile } from "../../types/applicant_profile.type"
import type { CourierApplication } from "../../types/courier_application.type"
import type { SellerApplication } from "../../types/seller_application.type"

const approvalsKey = ["bff", "approvals"] as const

function every(poll: boolean, milliseconds: number): number | false {
  return poll ? milliseconds : false
}

function sellerQueueQuery(filter: { status: SellerApplication["status"]; after: number }, poll: boolean) {
  return queryOptions({
    queryKey: [...approvalsKey, "sellers", filter.status, filter.after],
    queryFn: ({ signal }) => bffFetch(sellerApplicationsCall(filter), signal),
    refetchInterval: every(poll, 60_000)
  })
}

function courierQueueQuery(filter: { status: CourierApplication["status"]; after: number }, poll: boolean) {
  return queryOptions({
    queryKey: [...approvalsKey, "couriers", filter.status, filter.after],
    queryFn: ({ signal }) => bffFetch(courierApplicationsCall(filter), signal),
    refetchInterval: every(poll, 60_000)
  })
}

async function readProfile(userId: number, signal: AbortSignal): Promise<ApplicantProfile | null> {
  const result = await bffRequest(applicantProfileCall(userId), { signal })
  if (result.ok) {
    return result.value
  }

  if (result.failure.kind === "refused" && result.failure.status === 404) {
    return null
  }

  throw new BffError(result.failure)
}

function applicantProfileQuery(userId: number) {
  return queryOptions({
    queryKey: [...approvalsKey, "profile", userId],
    queryFn: ({ signal }) => readProfile(userId, signal),
    staleTime: 300_000
  })
}

export { applicantProfileQuery, approvalsKey, courierQueueQuery, sellerQueueQuery }
