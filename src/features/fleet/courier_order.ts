import type { CourierStatus } from "../../types/courier_status.type"
import type { FleetCourier } from "../../types/fleet_courier.type"

const rank: Readonly<Record<CourierStatus, number>> = { online: 0, busy: 1, offline: 2 }

function sortedCouriers(couriers: readonly FleetCourier[]): FleetCourier[] {
  return [...couriers].sort((a, b) => rank[a.status] - rank[b.status] || a.id - b.id)
}

function matchingCouriers(
  couriers: readonly FleetCourier[],
  status: CourierStatus | undefined,
  query: string
): FleetCourier[] {
  const wanted = query.trim()

  return couriers.filter(
    (courier) => (status === undefined || courier.status === status) && String(courier.id).includes(wanted)
  )
}

export { matchingCouriers, sortedCouriers }
