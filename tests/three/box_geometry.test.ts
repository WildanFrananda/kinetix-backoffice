import { describe, expect, it } from "vitest"
import { paintOrder, visibleFaces } from "../../src/three/box_geometry"
import type { DrawingBox } from "../../src/types/drawing_box.type"
import type { ScreenRect } from "../../src/types/screen_rect.type"

function box(x: number, y: number, z: number): DrawingBox {
  return { id: `box-${x}-${y}-${z}`, center: [x, y, z], half: [0.5, 0.5, 0.5], accent: false }
}

const everywhere: ScreenRect = { left: 0, top: 0, right: 100, bottom: 100 }

describe("the box painter", () => {
  it("shows only the faces that turn toward the camera", () => {
    const normals = visibleFaces(box(0, 0, 0), [1, 1, 1]).map((face) => face.normal.join(","))

    expect(normals.sort()).toEqual(["0,0,1", "0,1,0", "1,0,0"])
    expect(visibleFaces(box(0, 0, 0), [0, 0, -1]).map((face) => face.normal.join(","))).toEqual(["0,0,-1"])
  })

  it("paints the box farther from the camera first, whichever side the camera is on", () => {
    const near = box(2, 0, 0)
    const far = box(0, 0, 0)

    expect(paintOrder([near, far], [everywhere, everywhere], [1, 0.2, 0.3])).toEqual([1, 0])
    expect(paintOrder([near, far], [everywhere, everywhere], [-1, 0.2, 0.3])).toEqual([0, 1])
  })

  it("lets a long shelf go behind a post that stands in front of its end", () => {
    const shelf: DrawingBox = { id: "shelf", center: [0, 1, 0], half: [1.5, 0.03, 0.6], accent: false }
    const post: DrawingBox = { id: "post", center: [1.46, 1.3, 0.7], half: [0.04, 1.3, 0.04], accent: false }

    expect(paintOrder([post, shelf], [everywhere, everywhere], [0.7, 0.5, 0.7])).toEqual([1, 0])
  })

  it("orders boxes whose drawings do not touch by depth alone", () => {
    const apart: ScreenRect[] = [
      { left: 0, top: 0, right: 10, bottom: 10 },
      { left: 50, top: 50, right: 60, bottom: 60 }
    ]

    expect(paintOrder([box(0, 0, 3), box(0, 0, 0)], apart, [0, 0, 1])).toEqual([1, 0])
  })
})
