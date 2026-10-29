import { describe, expect, it } from "vitest"
import { trayModel } from "../../src/features/approvals/tray_model"
import type { DrawingBox } from "../../src/types/drawing_box.type"

function clock() {
  let now = 100

  return {
    read: () => now,
    advance: (seconds: number) => {
      now += seconds
    }
  }
}

function sheets(boxes: readonly DrawingBox[]): DrawingBox[] {
  return boxes.filter((box) => box.id.startsWith("sheet-"))
}

function sheet(boxes: readonly DrawingBox[], id: string): DrawingBox {
  const found = boxes.find((box) => box.id === `sheet-${id}`)
  if (found === undefined) {
    throw new Error(`no sheet ${id}`)
  }

  return found
}

function interpenetrate(a: DrawingBox, b: DrawingBox): boolean {
  return [0, 1, 2].every((axis) => {
    const gap = Math.abs((a.center[axis] ?? 0) - (b.center[axis] ?? 0))

    return gap < (a.half[axis] ?? 0) + (b.half[axis] ?? 0) - 1e-6
  })
}

const ids = Array.from({ length: 30 }, (_, index) => String(index + 1))

describe("the approvals tray drawing", () => {
  it("drops the waiting applications into the in-tray, oldest on top, then stops", () => {
    const time = clock()
    const model = trayModel({ reducedMotion: false, outcomes: ["approved", "rejected"], clock: time.read })

    model.show({ pending: ["11", "12", "13"], selected: null })
    expect(model.frame(time.read()).settled).toBe(false)

    time.advance(5)
    const frame = model.frame(time.read())
    const heights = ["11", "12", "13"].map((id) => sheet(frame.boxes, id).center[1])

    expect(frame.settled).toBe(true)
    expect(heights[0]).toBeGreaterThan(heights[1] ?? Infinity)
    expect(heights[1]).toBeGreaterThan(heights[2] ?? Infinity)
  })

  it("draws at most 20 sheets however long the queue is", () => {
    const time = clock()
    const model = trayModel({ reducedMotion: true, outcomes: ["approved", "rejected"], clock: time.read })

    model.show({ pending: ids, selected: null })

    expect(sheets(model.frame(time.read()).boxes)).toHaveLength(20)
  })

  it("pulls the selected application out of the stack, above the rest, in the accent", () => {
    const time = clock()
    const model = trayModel({ reducedMotion: true, outcomes: ["approved", "rejected"], clock: time.read })

    model.show({ pending: ["1", "2", "3"], selected: "2" })
    const boxes = model.frame(time.read()).boxes
    const pulled = sheet(boxes, "2")

    expect(pulled.accent).toBe(true)
    expect(pulled.center[1]).toBeGreaterThan(sheet(boxes, "1").center[1])
    expect(pulled.center[2]).toBeGreaterThan(sheet(boxes, "1").center[2])
    expect(sheet(boxes, "1").accent).toBe(false)
  })

  it("flies a decided application to its outcome's tray and wakes the painters", () => {
    const time = clock()
    const model = trayModel({ reducedMotion: false, outcomes: ["approved", "rejected"], clock: time.read })
    let woken = 0
    model.subscribe(() => {
      woken += 1
    })

    model.show({ pending: ["1", "2"], selected: "1" })
    time.advance(5)

    const before = sheet(model.frame(time.read()).boxes, "1").center
    model.decide("1", "rejected")
    time.advance(0.4)

    const midway = sheet(model.frame(time.read()).boxes, "1")
    time.advance(5)

    const landed = model.frame(time.read())
    const rejected = sheet(landed.boxes, "1")
    const tray = landed.boxes.find((box) => box.id === "tray-rejected-base")

    expect(woken).toBe(2)
    expect(midway.center[1]).toBeGreaterThan(before[1])
    expect(landed.settled).toBe(true)
    expect(rejected.accent).toBe(false)
    expect(rejected.center[0]).toBeCloseTo(tray?.center[0] ?? Number.NaN)
    expect(rejected.center[2]).toBeCloseTo(tray?.center[2] ?? Number.NaN)
  })

  it("keeps a decided application in its tray when the next list still names it", () => {
    const time = clock()
    const model = trayModel({ reducedMotion: true, outcomes: ["approved", "rejected"], clock: time.read })

    model.show({ pending: ["1", "2"], selected: "1" })
    model.decide("1", "approved")
    model.show({ pending: ["1", "2"], selected: "2" })

    const boxes = model.frame(time.read()).boxes
    const tray = boxes.find((box) => box.id === "tray-approved-base")

    expect(sheet(boxes, "1").center[0]).toBeCloseTo(tray?.center[0] ?? Number.NaN)
  })

  it("lifts away an application that left the queue without a decision here, then forgets it", () => {
    const time = clock()
    const model = trayModel({ reducedMotion: false, outcomes: ["approved", "rejected"], clock: time.read })

    model.show({ pending: ["1", "2"], selected: null })
    time.advance(5)
    model.frame(time.read())

    model.show({ pending: ["2"], selected: null })
    time.advance(5)

    expect(sheets(model.frame(time.read()).boxes).map((box) => box.id)).toEqual(["sheet-2"])
  })

  it("draws only the trays a queue can decide into", () => {
    const model = trayModel({ reducedMotion: true, outcomes: ["approved"], clock: () => 0 })
    const trays = new Set(
      model
        .frame(0)
        .boxes.filter((box) => box.id.startsWith("tray-"))
        .map((box) => box.id.split("-")[1])
    )

    expect([...trays].sort()).toEqual(["approved", "pending"])
  })

  it.each([
    ["a long queue", ids, "12"],
    ["a single application", ["1"], "1"],
    ["a short queue", ["1", "2", "4"], "2"]
  ])("never lets two boxes pass through each other once %s has settled", (_, pending, selected) => {
    const time = clock()
    const model = trayModel({ reducedMotion: false, outcomes: ["approved", "rejected"], clock: time.read })

    model.show({ pending: ids, selected: "7" })
    model.decide("3", "approved")
    model.decide("7", "rejected")
    model.decide("9", "approved")
    model.show({ pending, selected })
    time.advance(10)

    const frame = model.frame(time.read())
    const crossings: string[] = []

    frame.boxes.forEach((a, index) => {
      for (const b of frame.boxes.slice(index + 1)) {
        if (interpenetrate(a, b)) {
          crossings.push(`${a.id} × ${b.id}`)
        }
      }
    })

    expect(frame.settled).toBe(true)
    expect(crossings).toEqual([])
  })

  it("does not move under reduced motion: every change lands at once", () => {
    const time = clock()
    const model = trayModel({ reducedMotion: true, outcomes: ["approved", "rejected"], clock: time.read })

    model.show({ pending: ["1"], selected: "1" })
    model.decide("1", "approved")

    expect(model.frame(time.read()).settled).toBe(true)
  })
})
