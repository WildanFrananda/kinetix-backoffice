import { OrthographicCamera, Vector3 } from "three"
import type { DrawingBox } from "../types/drawing_box.type"
import type { DrawingClasses } from "../types/drawing_classes.type"
import type { DrawingHandle } from "../types/drawing_handle.type"
import type { DrawingModel } from "../types/drawing_model.type"
import type { ScreenRect } from "../types/screen_rect.type"
import type { Vector3Tuple } from "../types/vector3_tuple.type"
import { boxFaces, paintOrder, visibleFaces } from "./box_geometry"
import { drawingLoop } from "./drawing_loop"
import { floorGrid } from "./floor_grid"

const svgNamespace = "http://www.w3.org/2000/svg"

const upright = new Vector3(0, 1, 0)

function mountDrawing(
  svg: SVGSVGElement,
  options: {
    model: DrawingModel
    classes: DrawingClasses
  }
): DrawingHandle {
  const { model, classes } = options
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
  camera.position.set(...model.camera.position)
  camera.lookAt(...model.camera.target)
  camera.updateMatrixWorld()

  const looking = new Vector3()
  camera.getWorldDirection(looking)

  const floor = document.createElementNS(svgNamespace, "path")
  floor.setAttribute("class", classes.floor)
  const boxes = document.createElementNS(svgNamespace, "g")
  svg.append(floor, boxes)

  const pool: SVGPathElement[] = []
  const point = new Vector3()
  const lines = floorGrid(model.floorHalf)
  let width = 1
  let height = 1

  function screen(at: Vector3Tuple, turn: number): [number, number] {
    point.set(at[0], at[1], at[2]).applyAxisAngle(upright, turn).project(camera)

    return [((point.x + 1) / 2) * width, ((1 - point.y) / 2) * height]
  }

  function polygon(corners: readonly Vector3Tuple[], turn: number): string {
    const points = corners.map((at) =>
      screen(at, turn)
        .map((value) => value.toFixed(1))
        .join(",")
    )

    return `M${points.join("L")}Z`
  }

  function rectOf(box: DrawingBox, turn: number): ScreenRect {
    const rect: ScreenRect = { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }

    for (const face of boxFaces(box)) {
      for (const at of face.corners) {
        const [x, y] = screen(at, turn)
        rect.left = Math.min(rect.left, x)
        rect.right = Math.max(rect.right, x)
        rect.top = Math.min(rect.top, y)
        rect.bottom = Math.max(rect.bottom, y)
      }
    }

    return rect
  }

  function pathAt(index: number): SVGPathElement {
    const existing = pool[index]
    if (existing !== undefined) {
      return existing
    }

    const created = document.createElementNS(svgNamespace, "path")
    boxes.append(created)
    pool.push(created)

    return created
  }

  function draw(): boolean {
    const frame = model.frame(performance.now() / 1000)
    const toward = looking.clone().negate().applyAxisAngle(upright, -frame.turn)
    const towardCamera: Vector3Tuple = [toward.x, toward.y, toward.z]
    const rects = frame.boxes.map((box) => rectOf(box, frame.turn))

    floor.setAttribute(
      "d",
      lines.map(([from, to]) => `M${screen(from, frame.turn).join(",")}L${screen(to, frame.turn).join(",")}`).join("")
    )

    let used = 0

    for (const index of paintOrder(frame.boxes, rects, towardCamera)) {
      const box = frame.boxes[index]
      if (box === undefined) {
        continue
      }

      for (const face of visibleFaces(box, towardCamera)) {
        const path = pathAt(used)
        path.setAttribute("d", polygon(face.corners, frame.turn))
        path.setAttribute("class", box.accent ? classes.accent : classes.face)
        used += 1
      }
    }

    for (const unused of pool.slice(used)) {
      unused.setAttribute("d", "")
    }

    return frame.settled
  }

  const loop = drawingLoop(draw)
  const unsubscribe = model.subscribe(loop.wake)

  function resize(nextWidth: number, nextHeight: number): void {
    width = Math.max(1, nextWidth)
    height = Math.max(1, nextHeight)
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`)

    const aspect = width / height
    const view = model.camera.viewHeight
    camera.left = (-view * aspect) / 2
    camera.right = (view * aspect) / 2
    camera.top = view / 2
    camera.bottom = -view / 2
    camera.updateProjectionMatrix()

    if (!draw()) {
      loop.wake()
    }
  }

  function dispose(): void {
    loop.stop()
    unsubscribe()
    floor.remove()
    boxes.remove()
  }

  return { resize, setVisible: loop.setVisible, dispose }
}

export { mountDrawing }
