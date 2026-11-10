import type { GeoPoint } from "../types/geo_point.type"

const earthRadiusKm = 6371.0088

function radians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

function distanceKm(from: GeoPoint, to: GeoPoint): number {
  const deltaLatitude = radians(to.latitude - from.latitude)
  const deltaLongitude = radians(to.longitude - from.longitude)
  const chord =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(deltaLongitude / 2) ** 2

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(chord), Math.sqrt(1 - chord))
}

export { distanceKm, earthRadiusKm, radians }
