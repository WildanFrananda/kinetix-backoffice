import { describe, expect, it } from "vitest"
import { distanceKm } from "../../src/map/distance"
import { gridStep, planeView } from "../../src/map/plane_model"

const pickup = { latitude: -6.1754, longitude: 106.8272 }
const dropoff = { latitude: -6.2297, longitude: 106.8295 }
const courier = { latitude: -6.1689, longitude: 106.8203 }

describe("planeView", () => {
  it("has nothing to draw without a position", () => {
    expect(planeView([], 640, 360)).toBeNull()
  })

  it("keeps north up and east right, and every point inside the margin", () => {
    const view = planeView([pickup, dropoff, courier], 640, 360, 32)
    if (view === null) {
      throw new Error("expected a view")
    }

    const north = view.project(courier)
    const south = view.project(dropoff)
    const west = view.project(courier)
    const east = view.project(dropoff)

    expect(north.y).toBeLessThan(south.y)
    expect(west.x).toBeLessThan(east.x)

    for (const point of [pickup, dropoff, courier]) {
      const at = view.project(point)
      expect(at.x).toBeGreaterThanOrEqual(32 - 1e-9)
      expect(at.x).toBeLessThanOrEqual(640 - 32 + 1e-9)
      expect(at.y).toBeGreaterThanOrEqual(32 - 1e-9)
      expect(at.y).toBeLessThanOrEqual(360 - 32 + 1e-9)
    }
  })

  it("draws a scale bar whose length is the distance it names", () => {
    const view = planeView([pickup, dropoff], 640, 360)
    if (view === null) {
      throw new Error("expected a view")
    }

    const centre = { latitude: (pickup.latitude + dropoff.latitude) / 2, longitude: 106.82 }
    const from = view.project(centre)
    const kilometresPerPixel =
      distanceKm(centre, { ...centre, longitude: centre.longitude + 0.01 }) /
      (view.project({ ...centre, longitude: centre.longitude + 0.01 }).x - from.x)

    expect(view.scale.pixels * kilometresPerPixel).toBeCloseTo(view.scale.kilometres, 3)
    expect(view.scale.pixels).toBeLessThanOrEqual(640 / 4 + 1e-9)
  })

  it("rules a grid at a round step across the drawing", () => {
    const view = planeView([pickup, dropoff], 640, 360)
    if (view === null) {
      throw new Error("expected a view")
    }

    const latitudes = view.grid.filter((line) => line.axis === "latitude")
    const longitudes = view.grid.filter((line) => line.axis === "longitude")

    expect(latitudes.length).toBeGreaterThan(1)
    expect(longitudes.length).toBeGreaterThan(1)

    for (const line of latitudes) {
      expect(line.at).toBeGreaterThanOrEqual(0)
      expect(line.at).toBeLessThanOrEqual(360)
    }

    expect(gridStep(0.05)).toBe(0.01)
    expect(gridStep(2)).toBe(0.5)
  })

  it("draws a single point at the centre", () => {
    const view = planeView([pickup], 640, 360)

    expect(view?.project(pickup)).toEqual({ x: 320, y: 180 })
  })
})
