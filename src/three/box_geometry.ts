import type { BoxFace } from "../types/box_face.type"
import type { DrawingBox } from "../types/drawing_box.type"
import type { ScreenRect } from "../types/screen_rect.type"
import type { Vector3Tuple } from "../types/vector3_tuple.type"

const axes = [0, 1, 2] as const

const separation = 1e-6

function corner(box: DrawingBox, signs: Vector3Tuple): Vector3Tuple {
  return [
    box.center[0] + signs[0] * box.half[0],
    box.center[1] + signs[1] * box.half[1],
    box.center[2] + signs[2] * box.half[2]
  ]
}

function boxFaces(box: DrawingBox): BoxFace[] {
  return [
    {
      normal: [1, 0, 0],
      corners: [corner(box, [1, -1, -1]), corner(box, [1, 1, -1]), corner(box, [1, 1, 1]), corner(box, [1, -1, 1])]
    },
    {
      normal: [-1, 0, 0],
      corners: [corner(box, [-1, -1, 1]), corner(box, [-1, 1, 1]), corner(box, [-1, 1, -1]), corner(box, [-1, -1, -1])]
    },
    {
      normal: [0, 1, 0],
      corners: [corner(box, [-1, 1, -1]), corner(box, [-1, 1, 1]), corner(box, [1, 1, 1]), corner(box, [1, 1, -1])]
    },
    {
      normal: [0, -1, 0],
      corners: [corner(box, [-1, -1, 1]), corner(box, [-1, -1, -1]), corner(box, [1, -1, -1]), corner(box, [1, -1, 1])]
    },
    {
      normal: [0, 0, 1],
      corners: [corner(box, [-1, -1, 1]), corner(box, [1, -1, 1]), corner(box, [1, 1, 1]), corner(box, [-1, 1, 1])]
    },
    {
      normal: [0, 0, -1],
      corners: [corner(box, [1, -1, -1]), corner(box, [-1, -1, -1]), corner(box, [-1, 1, -1]), corner(box, [1, 1, -1])]
    }
  ]
}

function visibleFaces(box: DrawingBox, towardCamera: Vector3Tuple): BoxFace[] {
  return boxFaces(box).filter((face) => {
    const facing =
      face.normal[0] * towardCamera[0] + face.normal[1] * towardCamera[1] + face.normal[2] * towardCamera[2]

    return facing > separation
  })
}

function behind(a: DrawingBox, b: DrawingBox, towardCamera: Vector3Tuple): boolean {
  return axes.some((axis) => {
    const toward = towardCamera[axis]
    if (Math.abs(toward) <= separation) {
      return false
    }

    const aMin = a.center[axis] - a.half[axis]
    const aMax = a.center[axis] + a.half[axis]
    const bMin = b.center[axis] - b.half[axis]
    const bMax = b.center[axis] + b.half[axis]

    return toward > 0 ? aMax <= bMin + separation : aMin >= bMax - separation
  })
}

function overlaps(a: ScreenRect, b: ScreenRect): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

function depth(box: DrawingBox, towardCamera: Vector3Tuple): number {
  return box.center[0] * towardCamera[0] + box.center[1] * towardCamera[1] + box.center[2] * towardCamera[2]
}

function paintOrder(boxes: readonly DrawingBox[], rects: readonly ScreenRect[], towardCamera: Vector3Tuple): number[] {
  const before = boxes.map(() => new Set<number>())
  const waiting = boxes.map(() => 0)

  for (let a = 0; a < boxes.length; a += 1) {
    for (let b = a + 1; b < boxes.length; b += 1) {
      const boxA = boxes[a]
      const boxB = boxes[b]
      const rectA = rects[a]
      const rectB = rects[b]
      if (boxA === undefined || boxB === undefined || rectA === undefined || rectB === undefined) {
        continue
      }

      if (!overlaps(rectA, rectB)) {
        continue
      }

      const aBehind = behind(boxA, boxB, towardCamera)
      const bBehind = behind(boxB, boxA, towardCamera)
      if (aBehind === bBehind) {
        continue
      }

      const [first, second] = aBehind ? [a, b] : [b, a]
      before[first]?.add(second)
      waiting[second] = (waiting[second] ?? 0) + 1
    }
  }

  const byDepth = boxes.map((box, index) => ({ index, depth: depth(box, towardCamera) }))
  byDepth.sort((x, y) => x.depth - y.depth)

  const order: number[] = []
  const placed = new Set<number>()

  while (order.length < boxes.length) {
    const ready = byDepth.find(({ index }) => !placed.has(index) && waiting[index] === 0)
    const next = ready ?? byDepth.find(({ index }) => !placed.has(index))
    if (next === undefined) {
      break
    }

    order.push(next.index)
    placed.add(next.index)

    for (const later of before[next.index] ?? []) {
      waiting[later] = (waiting[later] ?? 0) - 1
    }
  }

  return order
}

export { boxFaces, paintOrder, visibleFaces }
