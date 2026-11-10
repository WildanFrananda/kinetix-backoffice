import type { GeoPoint } from "../types/geo_point.type"
import type { GridLine } from "../types/grid_line.type"
import type { PlaneView } from "../types/plane_view.type"
import type { ScaleBar } from "../types/scale_bar.type"
import { distanceKm, radians } from "./distance"

const gridSteps = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20]

const scaleSteps = [0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000]

const minimumSpanDegrees = 0.02

function spanOf(points: readonly GeoPoint[]) {
  const latitudes = points.map((point) => point.latitude)
  const longitudes = points.map((point) => point.longitude)

  return {
    south: Math.min(...latitudes),
    north: Math.max(...latitudes),
    west: Math.min(...longitudes),
    east: Math.max(...longitudes)
  }
}

function gridStep(span: number): number {
  return gridSteps.find((step) => span / step <= 6) ?? gridSteps[gridSteps.length - 1] ?? 1
}

function linesOf(axis: GridLine["axis"], from: number, to: number, step: number, place: (degrees: number) => number) {
  const lines: GridLine[] = []
  const first = Math.ceil(from / step) * step

  for (let degrees = first; degrees <= to + step * 1e-9; degrees += step) {
    const rounded = Number(degrees.toFixed(6))
    lines.push({ axis, degrees: rounded, at: place(rounded) })
  }

  return lines
}

function scaleOf(centre: GeoPoint, pixelsPerDegreeLongitude: number, width: number): ScaleBar {
  const oneDegreeEast: GeoPoint = { latitude: centre.latitude, longitude: centre.longitude + 1 }
  const kilometresPerPixel = distanceKm(centre, oneDegreeEast) / pixelsPerDegreeLongitude
  const target = (width / 4) * kilometresPerPixel
  const kilometres = [...scaleSteps].reverse().find((step) => step <= target) ?? scaleSteps[0] ?? 0.05

  return { kilometres, pixels: kilometres / kilometresPerPixel }
}

function planeView(points: readonly GeoPoint[], width: number, height: number, margin = 32): PlaneView | null {
  if (points.length === 0) {
    return null
  }

  const span = spanOf(points)
  const centre: GeoPoint = { latitude: (span.south + span.north) / 2, longitude: (span.west + span.east) / 2 }
  const squeeze = Math.cos(radians(centre.latitude))
  const latitudeSpan = Math.max(span.north - span.south, minimumSpanDegrees)
  const longitudeSpan = Math.max(span.east - span.west, minimumSpanDegrees)
  const room = { width: Math.max(1, width - margin * 2), height: Math.max(1, height - margin * 2) }
  const pixelsPerDegree = Math.min(room.width / (longitudeSpan * squeeze), room.height / latitudeSpan)
  const pixelsPerDegreeLongitude = pixelsPerDegree * squeeze

  function project(point: GeoPoint) {
    return {
      x: width / 2 + (point.longitude - centre.longitude) * pixelsPerDegreeLongitude,
      y: height / 2 - (point.latitude - centre.latitude) * pixelsPerDegree
    }
  }

  const visible = {
    west: centre.longitude - width / 2 / pixelsPerDegreeLongitude,
    east: centre.longitude + width / 2 / pixelsPerDegreeLongitude,
    south: centre.latitude - height / 2 / pixelsPerDegree,
    north: centre.latitude + height / 2 / pixelsPerDegree
  }

  const step = gridStep(Math.max(visible.east - visible.west, visible.north - visible.south))
  const grid = [
    ...linesOf(
      "longitude",
      visible.west,
      visible.east,
      step,
      (degrees) => project({ ...centre, longitude: degrees }).x
    ),
    ...linesOf("latitude", visible.south, visible.north, step, (degrees) => project({ ...centre, latitude: degrees }).y)
  ]

  return { width, height, project, grid, scale: scaleOf(centre, pixelsPerDegreeLongitude, width) }
}

export { gridStep, planeView }
