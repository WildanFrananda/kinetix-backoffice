import { describe, expect, it } from "vitest"
import { cabinetModel, cabinetShape } from "../../src/features/categories/cabinet_model"
import type { DrawingBox } from "../../src/types/drawing_box.type"

function overlapping(a: DrawingBox, b: DrawingBox): boolean {
  return [0, 1, 2].every((axis) => {
    const gap = Math.abs((a.center[axis] ?? 0) - (b.center[axis] ?? 0))

    return gap < (a.half[axis] ?? 0) + (b.half[axis] ?? 0) - 1e-6
  })
}

function clock() {
  let now = 20

  return { read: () => now, advance: (seconds: number) => (now += seconds) }
}

const names = Array.from({ length: 12 }, (_, index) => String(index + 1))

describe("the category cabinet", () => {
  it("is never wider than four drawers", () => {
    expect(cabinetShape(1)).toEqual({ columns: 1, rows: 1 })
    expect(cabinetShape(12)).toEqual({ columns: 4, rows: 3 })
    expect(cabinetShape(30)).toEqual({ columns: 4, rows: 8 })
  })

  it("pulls the chosen drawer out in the accent, no two boxes passing through each other", () => {
    const time = clock()
    const model = cabinetModel({ reducedMotion: false, capacity: names.length, clock: time.read })
    model.show(names, null)
    time.advance(5)
    model.frame(time.read())
    model.show(names, "6")
    time.advance(5)

    const frame = model.frame(time.read())
    const chosen = frame.boxes.find((box) => box.id === "drawer-6")
    const other = frame.boxes.find((box) => box.id === "drawer-5")

    expect(frame.settled).toBe(true)
    expect(frame.boxes.filter((box) => box.accent).map((box) => box.id)).toEqual(["drawer-6"])
    expect((chosen?.center[2] ?? 0) - (other?.center[2] ?? 0)).toBeGreaterThan(0.4)

    for (const [index, box] of frame.boxes.entries()) {
      for (const another of frame.boxes.slice(index + 1)) {
        expect(overlapping(box, another), `${box.id} and ${another.id}`).toBe(false)
      }
    }
  })

  it("lets a deleted category's drawer fly away and moves the rest into place", () => {
    const time = clock()
    const model = cabinetModel({ reducedMotion: false, capacity: names.length, clock: time.read })
    model.show(names, null)
    time.advance(5)
    model.show(
      names.filter((name) => name !== "2"),
      null
    )

    expect(model.frame(time.read() + 0.1).settled).toBe(false)
    time.advance(5)

    const boxes = model.frame(time.read()).boxes
    expect(boxes.some((box) => box.id === "drawer-2")).toBe(false)
    expect(boxes.filter((box) => box.id.startsWith("drawer-"))).toHaveLength(11)
  })
})
