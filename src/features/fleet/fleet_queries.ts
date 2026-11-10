import { queryOptions, skipToken } from "@tanstack/react-query"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { bffRequest } from "../../api/bff_request"
import { courierCall } from "../../api/calls/courier_call"
import { courierJobsCall } from "../../api/calls/courier_jobs_call"
import { dispatchJobCall } from "../../api/calls/dispatch_job_call"
import { dispatchJobsCall } from "../../api/calls/dispatch_jobs_call"
import { fleetCouriersCall } from "../../api/calls/fleet_couriers_call"
import { nearbyCouriersCall } from "../../api/calls/nearby_couriers_call"
import type { DispatchFilter } from "../../types/dispatch_filter.type"
import type { DispatchJob } from "../../types/dispatch_job.type"
import type { FleetCourier } from "../../types/fleet_courier.type"
import type { NearbyQuery } from "../../types/nearby_query.type"

const fleetKey = ["bff", "fleet"] as const

const jobsKey = [...fleetKey, "jobs"] as const

const jobListPollMs = 15_000

const positionsPollMs = 10_000

function every(poll: boolean, milliseconds: number): number | false {
  return poll ? milliseconds : false
}

function jobsQuery(filter: DispatchFilter, poll: boolean) {
  return queryOptions({
    queryKey: [...jobsKey, filter.status ?? "all", filter.before ?? 0],
    queryFn: ({ signal }) => bffFetch(dispatchJobsCall(filter), signal, "background"),
    refetchInterval: every(poll, jobListPollMs)
  })
}

function jobKey(id: number) {
  return [...fleetKey, "job", id] as const
}

async function readJob(id: number, signal: AbortSignal): Promise<DispatchJob | null> {
  const result = await bffRequest(dispatchJobCall(id), { signal })
  if (result.ok) {
    return result.value
  }

  if (result.failure.kind === "refused" && result.failure.status === 404 && result.failure.code === "not_found") {
    return null
  }

  throw new BffError(result.failure)
}

function jobQuery(id: number) {
  return queryOptions({
    queryKey: jobKey(id),
    queryFn: ({ signal }) => readJob(id, signal)
  })
}

function couriersQuery(poll: boolean) {
  return queryOptions({
    queryKey: [...fleetKey, "couriers"],
    queryFn: ({ signal }) => bffFetch(fleetCouriersCall, signal, "background"),
    refetchInterval: every(poll, positionsPollMs)
  })
}

async function readCourier(id: number, signal: AbortSignal): Promise<FleetCourier | null> {
  const result = await bffRequest(courierCall(id), { signal })
  if (result.ok) {
    return result.value
  }

  if (result.failure.kind === "refused" && result.failure.status === 404 && result.failure.code === "not_found") {
    return null
  }

  throw new BffError(result.failure)
}

function courierQuery(id: number | null) {
  return queryOptions({
    queryKey: [...fleetKey, "courier", id ?? 0],
    queryFn: id === null ? skipToken : ({ signal }) => readCourier(id, signal)
  })
}

function nearbyQuery(query: NearbyQuery | null) {
  return queryOptions({
    queryKey: [...fleetKey, "nearby", query?.near.latitude ?? 0, query?.near.longitude ?? 0, query?.radiusKm ?? 0],
    queryFn: query === null ? skipToken : ({ signal }) => bffFetch(nearbyCouriersCall(query), signal)
  })
}

function courierJobsQuery(courierId: number | null) {
  return queryOptions({
    queryKey: [...fleetKey, "courier-jobs", courierId ?? 0],
    queryFn: courierId === null ? skipToken : ({ signal }) => bffFetch(courierJobsCall(courierId), signal)
  })
}

export {
  courierJobsQuery,
  courierQuery,
  couriersQuery,
  fleetKey,
  jobKey,
  jobListPollMs,
  jobQuery,
  jobsKey,
  jobsQuery,
  nearbyQuery,
  positionsPollMs
}
