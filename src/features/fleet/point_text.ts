import type { GeoPoint } from "../../types/geo_point.type"

function pointText(point: GeoPoint): string {
  return `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
}

export { pointText }
