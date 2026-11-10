import type { GeoPoint } from "./geo_point.type"

type MapPlace = {
  id: string
  kind: "courier" | "pickup" | "dropoff"
  tone: "online" | "busy" | "offline" | "job"
  point: GeoPoint
  label: string
  selected: boolean
}

export type { MapPlace }
