import type { DispatchJobStatus } from "./dispatch_job_status.type"
import type { GeoPoint } from "./geo_point.type"
import type { ProofOfDelivery } from "./proof_of_delivery.type"

type DispatchJob = {
  id: number
  orderNumber: string | null
  awbNumber: string | null
  status: DispatchJobStatus
  merchantPrincipalId: string | null
  weightKg: number
  courierId: number | null
  pickup: GeoPoint
  dropoff: GeoPoint
  assignedAt: Date | null
  deliveredAt: Date | null
  insertedAt: Date
  proof: ProofOfDelivery | null
}

export type { DispatchJob }
