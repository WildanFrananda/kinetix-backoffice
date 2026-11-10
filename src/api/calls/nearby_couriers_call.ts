import type { BffCall } from "../../types/bff_call.type"
import type { NearbyCourier } from "../../types/nearby_courier.type"
import type { NearbyQuery } from "../../types/nearby_query.type"
import { nearbyListSchema } from "../schemas/dispatch_schemas"

function nearbyCouriersCall(query: NearbyQuery): BffCall<NearbyCourier[]> {
  return {
    endpoint: "matching.nearbyDrivers",
    method: "GET",
    path: "/bff/api/v1/matching/drivers/nearby",
    query: {
      latitude: String(query.near.latitude),
      longitude: String(query.near.longitude),
      radius_km: String(query.radiusKm)
    },
    schema: nearbyListSchema
  }
}

export { nearbyCouriersCall }
