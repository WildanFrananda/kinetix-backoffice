import type { GeoPoint } from "./geo_point.type"

type NearbyQuery = {
  near: GeoPoint
  radiusKm: number
}

export type { NearbyQuery }
