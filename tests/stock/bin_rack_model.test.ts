import { describe, expect, it } from "vitest"
import { binRackModel } from "../../src/features/stock/bin_rack_model"
import type { DrawingBox } from "../../src/types/drawing_box.type"
import type { RackBin } from "../../src/types/rack_bin.type"

function overlapping(a: DrawingBox, b: DrawingBox): boolean {
  return [0, 1, 2].every((axis) => {
    const gap = Math.abs((a.center[axis] ?? 0) - (b.center[axis] ?? 0))

    return gap < (a.half[axis] ?? 0) + (b.half[axis] ?? 0) - 1e-6
  })
}

function clock() {
  let now = 10

  return { read: () => now, advance: (seconds: number) => (now += seconds) }
}

const bins: RackBin[] = [
  { code: "A-01-1", zone: "A", shelfLevel: 1, stocked: true },
  { code: "A-01-2", zone: "A", shelfLevel: 2, stocked: false },
  { code: "A-02-1", zone: "A", shelfLevel: 1, stocked: true },
  { code: "B-01-1", zone: "B", shelfLevel: 1, stocked: true },
  { code: "B-01-9", zone: "B", shelfLevel: 2_000_000_000, stocked: true },
  { code: "C-01-0", zone: "C", shelfLevel: 0, stocked: false }
]

function settledFrame(selected: string | null) {
  const time = clock()
  const model = binRackModel({ reducedMotion: false, bins, clock: time.read })
  model.show(bins, null)
  time.advance(5)
  model.frame(time.read())
  model.show(bins, selected)
  time.advance(5)

  return { model, frame: model.frame(time.read()) }
}

describe("the rack drawing", () => {
  it("stands every bin on its shelf, no two boxes passing through each other", () => {
    const { frame } = settledFrame("A-02-1")
    const boxes = frame.boxes

    expect(frame.settled).toBe(true)
    expect(boxes.filter((box) => box.id.startsWith("bin-"))).toHaveLength(bins.length)

    for (const [index, box] of boxes.entries()) {
      for (const other of boxes.slice(index + 1)) {
        expect(overlapping(box, other), `${box.id} and ${other.id}`).toBe(false)
      }
    }
  })

  it("pulls the chosen bin out in the accent, and draws stocked bins taller than empty ones", () => {
    const { frame } = settledFrame("A-02-1")
    const byId = new Map(frame.boxes.map((box) => [box.id, box]))
    const chosen = byId.get("bin-A-02-1")
    const neighbour = byId.get("bin-A-01-1")
    const empty = byId.get("bin-A-01-2")

    expect(chosen?.accent).toBe(true)
    expect(neighbour?.accent).toBe(false)
    expect((chosen?.center[2] ?? 0) - (neighbour?.center[2] ?? 0)).toBeGreaterThan(0.3)
    expect(empty?.half[1] ?? 1).toBeLessThan(neighbour?.half[1] ?? 0)
  })

  it("keeps a huge shelf level on the rack by its rank, and lets a bin that left the page fly away", () => {
    const time = clock()
    const model = binRackModel({ reducedMotion: false, bins, clock: time.read })
    model.show(bins, null)
    time.advance(5)

    const tall = model.frame(time.read()).boxes.find((box) => box.id === "bin-B-01-9")
    expect(tall?.center[1] ?? 99).toBeLessThan(2)

    model.show(bins.slice(1), null)
    time.advance(5)

    expect(model.frame(time.read()).boxes.some((box) => box.id === "bin-A-01-1")).toBe(false)
  })

  it("draws the final state at once under reduced motion", () => {
    const model = binRackModel({ reducedMotion: true, bins, clock: () => 3 })
    model.show(bins, "C-01-0")

    expect(model.frame(3).settled).toBe(true)
  })
})
