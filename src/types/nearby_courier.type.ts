import type { FleetCourier } from "./fleet_courier.type"

type NearbyCourier = FleetCourier & {
  distanceKm: number
}

export type { NearbyCourier }
