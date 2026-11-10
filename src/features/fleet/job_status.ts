import type { CourierStatus } from "../../types/courier_status.type"
import type { DispatchJobStatus } from "../../types/dispatch_job_status.type"

const jobStatuses: readonly DispatchJobStatus[] = ["pending", "assigned", "picked_up", "delivered", "cancelled"]

const courierStatuses: readonly CourierStatus[] = ["online", "busy", "offline"]

function jobTone(status: DispatchJobStatus): "attention" | "settled" | "neutral" {
  if (status === "pending") {
    return "attention"
  }

  return status === "delivered" ? "settled" : "neutral"
}

function courierTone(status: CourierStatus): "attention" | "settled" | "neutral" {
  if (status === "online") {
    return "settled"
  }

  return status === "busy" ? "attention" : "neutral"
}

export { courierStatuses, courierTone, jobStatuses, jobTone }
