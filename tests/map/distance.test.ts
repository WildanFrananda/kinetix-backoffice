import { describe, expect, it } from "vitest"
import { distanceKm } from "../../src/map/distance"

const pickup = { latitude: -6.1754, longitude: 106.8272 }

describe("distanceKm", () => {
  it("measures as matching does: its documented distances to the pickup, to the metre", () => {
    expect(distanceKm(pickup, { latitude: -6.1801, longitude: 106.8295 })).toBeCloseTo(0.581, 3)
    expect(distanceKm(pickup, { latitude: -6.1689, longitude: 106.8203 })).toBeCloseTo(1.051, 3)
  })

  it("is zero on the spot, the same both ways, and a degree of latitude is about 111 km", () => {
    const dropoff = { latitude: -6.2297, longitude: 106.8295 }

    expect(distanceKm(pickup, pickup)).toBe(0)
    expect(distanceKm(pickup, dropoff)).toBeCloseTo(distanceKm(dropoff, pickup), 12)
    expect(distanceKm({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })).toBeCloseTo(111.195, 2)
  })
})
