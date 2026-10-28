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
import type { DrawingColors } from "../types/drawing_colors.type"
import type { DrawingHandle } from "../types/drawing_handle.type"
import type { DrawingPiece } from "../types/drawing_piece.type"
import { drawingParts } from "./drawing_parts"

const viewHeight = 4.9

const assembleSeconds = 1.8

const stepSeconds = 0.07

const turnSeconds = 72

const inkWidth = 1.35

function easeOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))

  return 1 - (1 - clamped) ** 3
}

function floorGrid(): number[] {
  const points: number[] = []
  const half = 2.5

  for (let step = -half; step <= half + 0.001; step += 0.5) {
    points.push(step, 0, -half, step, 0, half)
    points.push(-half, 0, step, half, 0, step)
  }

  return points
}

function outlineOf(box: BoxGeometry): LineSegmentsGeometry {
  const edges = new EdgesGeometry(box)
  const outline = new LineSegmentsGeometry().fromEdgesGeometry(edges)
  edges.dispose()

  return outline
}

function mountDrawing(
  canvas: HTMLCanvasElement,
  options: {
    colors: DrawingColors
    reducedMotion: boolean
  }
): DrawingHandle {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100)
  camera.position.set(6, 4.6, 6)
  camera.lookAt(0, 1.15, 0)

  const rig = new Group()
  rig.rotation.y = -0.38
  scene.add(rig)

  const paper = new MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
  const ink = new LineMaterial({ linewidth: inkWidth })
  const accent = new LineMaterial({ linewidth: inkWidth * 1.4 })
  const rule = new LineMaterial({ linewidth: 1 })
  const disposables: Disposable[] = [paper, ink, accent, rule]

  const gridGeometry = new LineSegmentsGeometry().setPositions(floorGrid())
  rig.add(new LineSegments2(gridGeometry, rule))
  disposables.push(gridGeometry)

  const built: DrawingPiece[] = drawingParts.map((part) => {
    const box = new BoxGeometry(...part.size)
    const edges = outlineOf(box)
    const holder = new Group()
    holder.add(new Mesh(box, paper))
    holder.add(new LineSegments2(edges, part.accent ? accent : ink))
    rig.add(holder)
    disposables.push(box, edges)

    return { part, holder }
  })

  let started = performance.now()
  let running = false
  let frame = 0
  let width = 1
  let height = 1

  function place(elapsed: number): void {
    built.forEach(({ part, holder }, index) => {
      const progress = options.reducedMotion ? 1 : easeOutCubic((elapsed - index * stepSeconds) / assembleSeconds)
      const spread = 1 - progress
      holder.position.set(
        part.home[0] + part.offset[0] * spread,
        part.home[1] + part.offset[1] * spread,
        part.home[2] + part.offset[2] * spread
      )
    })

    if (!options.reducedMotion) {
      rig.rotation.y = -0.38 + ((elapsed / turnSeconds) % 1) * Math.PI * 2
    }
  }

  function draw(): void {
    place((performance.now() - started) / 1000)
    renderer.render(scene, camera)
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
    renderer.setSize(width, height, false)

    const aspect = width / height
    camera.left = (-viewHeight * aspect) / 2
    camera.right = (viewHeight * aspect) / 2
    camera.top = viewHeight / 2
    camera.bottom = -viewHeight / 2
    camera.updateProjectionMatrix()

    for (const material of [ink, accent, rule]) {
      material.resolution.set(width, height)
    }

    draw()
  }

  function recolor(colors: DrawingColors): void {
    paper.color.set(colors.paper)
    ink.color.set(colors.ink)
    accent.color.set(colors.accent)
    rule.color.set(colors.rule)
    draw()
  }

  function dispose(): void {
    window.cancelAnimationFrame(frame)
    running = false

    for (const item of disposables) {
      item.dispose()
    }

    renderer.dispose()
  }

  recolor(options.colors)
  started = performance.now()

  return { resize, recolor, setRunning, dispose }
}

export { mountDrawing }
