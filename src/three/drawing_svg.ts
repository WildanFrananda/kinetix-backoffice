import { OrthographicCamera, Vector3 } from "three"
import type { DrawingBox } from "../types/drawing_box.type"
import type { DrawingHandle } from "../types/drawing_handle.type"
import type { DrawingPart } from "../types/drawing_part.type"
import type { ScreenRect } from "../types/screen_rect.type"
import type { Vector3Tuple } from "../types/vector3_tuple.type"
import { boxFaces, paintOrder, visibleFaces } from "./box_geometry"
import { drawingParts } from "./drawing_parts"

const svgNamespace = "http://www.w3.org/2000/svg"

const viewHeight = 4.9

const assembleSeconds = 1.8

const stepSeconds = 0.07

const turnSeconds = 72

const startTurn = -0.38

const upright = new Vector3(0, 1, 0)

function easeOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))

  return 1 - (1 - clamped) ** 3
}

function floorLines(): Array<[Vector3Tuple, Vector3Tuple]> {
  const lines: Array<[Vector3Tuple, Vector3Tuple]> = []
  const half = 2.5

  for (let step = -half; step <= half + 0.001; step += 0.5) {
    lines.push([
      [step, 0, -half],
      [step, 0, half]
    ])

    lines.push([
      [-half, 0, step],
      [half, 0, step]
    ])
  }

  return lines
}

function placed(part: DrawingPart, index: number, elapsed: number, reducedMotion: boolean): DrawingBox {
  const progress = reducedMotion ? 1 : easeOutCubic((elapsed - index * stepSeconds) / assembleSeconds)
  const spread = 1 - progress

  return {
    center: [
      part.home[0] + part.offset[0] * spread,
      part.home[1] + part.offset[1] * spread,
      part.home[2] + part.offset[2] * spread
    ],
    half: [part.size[0] / 2, part.size[1] / 2, part.size[2] / 2],
    accent: part.accent
  }
}

function mountDrawing(
  svg: SVGSVGElement,
  options: {
    reducedMotion: boolean
    classes: { face: string; accent: string; floor: string }
  }
): DrawingHandle {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
  camera.position.set(6, 4.6, 6)
  camera.lookAt(0, 1.15, 0)
  camera.updateMatrixWorld()

  const looking = new Vector3()
  camera.getWorldDirection(looking)

  const floor = document.createElementNS(svgNamespace, "path")
  floor.setAttribute("class", options.classes.floor)
  const boxes = document.createElementNS(svgNamespace, "g")
  svg.append(floor, boxes)

  const pool: SVGPathElement[] = []
  const point = new Vector3()
  const lines = floorLines()
  let width = 1
  let height = 1
  let started = performance.now()
  let running = false
  let frame = 0

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

  function draw(): void {
    const elapsed = (performance.now() - started) / 1000
    const turn = options.reducedMotion ? startTurn : startTurn + ((elapsed / turnSeconds) % 1) * Math.PI * 2
    const toward = looking.clone().negate().applyAxisAngle(upright, -turn)
    const towardCamera: Vector3Tuple = [toward.x, toward.y, toward.z]
    const placedBoxes = drawingParts.map((part, index) => placed(part, index, elapsed, options.reducedMotion))
    const rects = placedBoxes.map((box) => rectOf(box, turn))

    floor.setAttribute(
      "d",
      lines.map(([from, to]) => `M${screen(from, turn).join(",")}L${screen(to, turn).join(",")}`).join("")
    )

    let used = 0

    for (const index of paintOrder(placedBoxes, rects, towardCamera)) {
      const box = placedBoxes[index]
      if (box === undefined) {
        continue
      }

      for (const face of visibleFaces(box, towardCamera)) {
        const path = pathAt(used)
        path.setAttribute("d", polygon(face.corners, turn))
        path.setAttribute("class", box.accent ? options.classes.accent : options.classes.face)
        used += 1
      }
    }

    for (const unused of pool.slice(used)) {
      unused.setAttribute("d", "")
    }
  }

  function tick(): void {
    draw()
    frame = running ? window.requestAnimationFrame(tick) : 0
  }

  function setRunning(next: boolean): void {
    if (options.reducedMotion || next === running) {
      return
    }

    running = next
    if (running) {
      frame = window.requestAnimationFrame(tick)

      return
    }

    window.cancelAnimationFrame(frame)
  }

  function resize(nextWidth: number, nextHeight: number): void {
    width = Math.max(1, nextWidth)
    height = Math.max(1, nextHeight)
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`)

    const aspect = width / height
    camera.left = (-viewHeight * aspect) / 2
    camera.right = (viewHeight * aspect) / 2
    camera.top = viewHeight / 2
    camera.bottom = -viewHeight / 2
    camera.updateProjectionMatrix()
    draw()
  }

  function dispose(): void {
    window.cancelAnimationFrame(frame)
    running = false
    floor.remove()
    boxes.remove()
  }

  started = performance.now()

  return { resize, setRunning, dispose }
}

export { mountDrawing }
