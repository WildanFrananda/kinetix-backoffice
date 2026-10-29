import { describe, expect, it } from "vitest"
import { sessionFuseModel } from "../../src/features/session/session_fuse_model"
import type { DrawingBox } from "../../src/types/drawing_box.type"

function cubes(boxes: readonly DrawingBox[]): DrawingBox[] {
  return boxes.filter((box) => box.id.startsWith("cube-"))
}

function overlapping(a: DrawingBox, b: DrawingBox): boolean {
  return [0, 1, 2].every((axis) => {
    const gap = Math.abs((a.center[axis] ?? 0) - (b.center[axis] ?? 0))

    return gap < (a.half[axis] ?? 0) + (b.half[axis] ?? 0) - 1e-6
  })
}

function clock() {
  let now = 50

  return { read: () => now, advance: (seconds: number) => (now += seconds) }
}

describe("the session drawing", () => {
  it("stands one cube per minute left, the next to go in the accent, then stops", () => {
    const time = clock()
    const model = sessionFuseModel({ reducedMotion: false, cells: 15, clock: time.read })

    model.show(9)
    expect(model.frame(time.read()).settled).toBe(false)
    time.advance(5)

    const frame = model.frame(time.read())
    const standing = cubes(frame.boxes)

    expect(frame.settled).toBe(true)
    expect(standing).toHaveLength(9)
    expect(standing.filter((cube) => cube.accent).map((cube) => cube.id)).toEqual(["cube-8"])
  })

  it("lifts the last cube away when a minute passes, and drops cubes back when the session is extended", () => {
    const time = clock()
    const model = sessionFuseModel({ reducedMotion: false, cells: 15, clock: time.read })
    model.show(9)
    time.advance(5)
    model.frame(time.read())

    model.show(8)
    time.advance(0.2)
    const leaving = cubes(model.frame(time.read()).boxes).find((cube) => cube.id === "cube-8")
    time.advance(5)

    expect(leaving?.accent).toBe(true)
    expect(cubes(model.frame(time.read()).boxes)).toHaveLength(8)

    model.show(15)
    time.advance(5)
    const refilled = cubes(model.frame(time.read()).boxes)

    expect(refilled).toHaveLength(15)
    expect(refilled.filter((cube) => cube.accent).map((cube) => cube.id)).toEqual(["cube-14"])
  })

  it("never draws more cubes than the idle limit has minutes", () => {
    const model = sessionFuseModel({ reducedMotion: true, cells: 15, clock: () => 0 })

    model.show(42)

    expect(cubes(model.frame(0).boxes)).toHaveLength(15)
  })

  it("lands at once under reduced motion", () => {
    const model = sessionFuseModel({ reducedMotion: true, cells: 15, clock: () => 0 })

    model.show(3)

    expect(model.frame(0).settled).toBe(true)
  })

  it("never lets two boxes pass through each other", () => {
    const model = sessionFuseModel({ reducedMotion: true, cells: 15, clock: () => 0 })
    model.show(15)
    const boxes = model.frame(0).boxes
    const crossings: string[] = []

    boxes.forEach((a, index) => {
      for (const b of boxes.slice(index + 1)) {
        if (overlapping(a, b)) {
          crossings.push(`${a.id} × ${b.id}`)
        }
      }
    })

    expect(crossings).toEqual([])
  })
})
