import { queryOptions } from "@tanstack/react-query"
import { bffFetch } from "../../api/bff_fetch"
import { dispatchSummaryCall } from "../../api/calls/dispatch_summary_call"
import { pendingCourierApplicationsCall } from "../../api/calls/pending_courier_applications_call"
import { pendingSellerApplicationsCall } from "../../api/calls/pending_seller_applications_call"
import { returnsNeedingAttentionCall } from "../../api/calls/returns_needing_attention_call"
import { sagasNeedingAttentionCall } from "../../api/calls/sagas_needing_attention_call"

const overviewKey = ["bff", "overview"] as const

function every(poll: boolean, milliseconds: number): number | false {
  return poll ? milliseconds : false
}

function dispatchSummaryQuery(poll: boolean) {
  return queryOptions({
    queryKey: [...overviewKey, "dispatch"],
    queryFn: ({ signal }) => bffFetch(dispatchSummaryCall, signal, "background"),
    refetchInterval: every(poll, 15_000)
  })
}

function sellerApplicationsQuery(poll: boolean) {
  return queryOptions({
    queryKey: [...overviewKey, "seller-applications"],
    queryFn: ({ signal }) => bffFetch(pendingSellerApplicationsCall, signal, "background"),
    refetchInterval: every(poll, 120_000)
  })
}

function courierApplicationsQuery(poll: boolean) {
  return queryOptions({
    queryKey: [...overviewKey, "courier-applications"],
    queryFn: ({ signal }) => bffFetch(pendingCourierApplicationsCall, signal, "background"),
    refetchInterval: every(poll, 120_000)
  })
}

function sagasQuery(poll: boolean) {
  return queryOptions({
    queryKey: [...overviewKey, "sagas"],
    queryFn: ({ signal }) => bffFetch(sagasNeedingAttentionCall, signal, "background"),
    refetchInterval: every(poll, 60_000)
  })
}

function returnsQuery(poll: boolean) {
  return queryOptions({
    queryKey: [...overviewKey, "returns"],
    queryFn: ({ signal }) => bffFetch(returnsNeedingAttentionCall, signal, "background"),
    refetchInterval: every(poll, 60_000)
  })
}

export {
  courierApplicationsQuery,
  dispatchSummaryQuery,
  overviewKey,
  returnsQuery,
  sagasQuery,
  sellerApplicationsQuery
}
