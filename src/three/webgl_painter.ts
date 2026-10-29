import {
  BoxGeometry,
  EdgesGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  WebGLRenderer
} from "three"
import { LineMaterial } from "three/addons/lines/LineMaterial.js"
import { LineSegments2 } from "three/addons/lines/LineSegments2.js"
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js"
import type { Disposable } from "../types/disposable.type"
import type { DrawingBox } from "../types/drawing_box.type"
import type { DrawingColors } from "../types/drawing_colors.type"
import type { DrawingHandle } from "../types/drawing_handle.type"
import type { DrawingModel } from "../types/drawing_model.type"
import type { DrawingPiece } from "../types/drawing_piece.type"
import { drawingLoop } from "./drawing_loop"
import { floorGrid } from "./floor_grid"

const inkWidth = 1.35

function unitOutline(box: BoxGeometry): LineSegmentsGeometry {
  const edges = new EdgesGeometry(box)
  const outline = new LineSegmentsGeometry().fromEdgesGeometry(edges)
  edges.dispose()

  return outline
}

function mountDrawing(
  canvas: HTMLCanvasElement,
  options: {
    model: DrawingModel
    readColors: () => DrawingColors
  }
): DrawingHandle {
  const { model } = options
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
  camera.position.set(...model.camera.position)
  camera.lookAt(...model.camera.target)

  const rig = new Group()
  scene.add(rig)

  const paper = new MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
  const ink = new LineMaterial({ linewidth: inkWidth })
  const accent = new LineMaterial({ linewidth: inkWidth * 1.4 })
  const rule = new LineMaterial({ linewidth: 1 })
  const unitBox = new BoxGeometry(1, 1, 1)
  const unitEdges = unitOutline(unitBox)
  const gridGeometry = new LineSegmentsGeometry().setPositions(floorGrid(model.floorHalf).flat(2))
  const disposables: Disposable[] = [paper, ink, accent, rule, unitBox, unitEdges, gridGeometry]

  rig.add(new LineSegments2(gridGeometry, rule))

  const pieces = new Map<string, DrawingPiece>()

  function pieceFor(id: string): DrawingPiece {
    const existing = pieces.get(id)
    if (existing !== undefined) {
      return existing
    }

    const holder = new Group()
    const outline = new LineSegments2(unitEdges, ink)
    holder.add(new Mesh(unitBox, paper), outline)
    rig.add(holder)

    const created = { holder, outline }
    pieces.set(id, created)

    return created
  }

  function sync(boxes: readonly DrawingBox[]): void {
    const seen = new Set<string>()

    for (const box of boxes) {
      const piece = pieceFor(box.id)
      piece.holder.position.set(...box.center)
      piece.holder.scale.set(box.half[0] * 2, box.half[1] * 2, box.half[2] * 2)
      piece.outline.material = box.accent ? accent : ink
      seen.add(box.id)
    }

    for (const [id, piece] of pieces) {
      if (!seen.has(id)) {
        rig.remove(piece.holder)
        pieces.delete(id)
      }
    }
  }

  function draw(): boolean {
    const frame = model.frame(performance.now() / 1000)
    sync(frame.boxes)
    rig.rotation.y = frame.turn
    renderer.render(scene, camera)

    return frame.settled
  }

  const loop = drawingLoop(draw)
  const unsubscribe = model.subscribe(loop.wake)

  function resize(width: number, height: number): void {
    const safeWidth = Math.max(1, width)
    const safeHeight = Math.max(1, height)
    renderer.setSize(safeWidth, safeHeight, false)

    const aspect = safeWidth / safeHeight
    const view = model.camera.viewHeight
    camera.left = (-view * aspect) / 2
    camera.right = (view * aspect) / 2
    camera.top = view / 2
    camera.bottom = -view / 2
    camera.updateProjectionMatrix()

    for (const material of [ink, accent, rule]) {
      material.resolution.set(safeWidth, safeHeight)
    }

    if (!draw()) {
      loop.wake()
    }
  }

  function recolor(colors: DrawingColors): void {
    paper.color.set(colors.paper)
    ink.color.set(colors.ink)
    accent.color.set(colors.accent)
    rule.color.set(colors.rule)
    draw()
  }

  const theme = new MutationObserver(() => recolor(options.readColors()))
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

  function dispose(): void {
    loop.stop()
    unsubscribe()
    theme.disconnect()

    for (const item of disposables) {
      item.dispose()
    }

    renderer.dispose()
  }

  recolor(options.readColors())

  return { resize, setVisible: loop.setVisible, dispose }
}

export { mountDrawing }
