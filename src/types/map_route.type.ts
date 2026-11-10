import type { GeoPoint } from "./geo_point.type"

type MapRoute = {
  id: string
  from: GeoPoint
  to: GeoPoint
  selected: boolean
}

export type { MapRoute }
