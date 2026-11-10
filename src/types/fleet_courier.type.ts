import type { CourierStatus } from "./courier_status.type"
import type { GeoPoint } from "./geo_point.type"

type FleetCourier = {
  id: number
  status: CourierStatus
  position: GeoPoint | null
  speedKmh: number | null
  bearingDeg: number | null
  recordedAt: Date | null
  updatedAt: Date | null
}

export type { FleetCourier }
