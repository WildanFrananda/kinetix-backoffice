import { arrived, positionOf, samePlace } from "../../three/moving_piece"
import type { BinRackModel } from "../../types/bin_rack_model.type"
import type { DrawingBox } from "../../types/drawing_box.type"
import type { DrawingCamera } from "../../types/drawing_camera.type"
import type { DrawingFrame } from "../../types/drawing_frame.type"
import type { MovingPiece } from "../../types/moving_piece.type"
import type { RackBin } from "../../types/rack_bin.type"
import type { Vector3Tuple } from "../../types/vector3_tuple.type"

const drawnBins = 60

const pitch = 0.72

const rowGap = 1.6

const levelHeight = 0.56

const shelfHalf: Vector3Tuple = [0.36, 0.015, 0.32]

const stockedHalf: Vector3Tuple = [0.27, 0.17, 0.24]

const emptyHalf: Vector3Tuple = [0.27, 0.03, 0.24]

const pulled = 0.42

const timing = { arrive: 0.5, move: 0.35, leave: 0.35, step: 0.02 }

type Placed = {
  bin: RackBin
  row: number
  column: number
  level: number
}

function ranks(values: readonly number[]): Map<number, number> {
  return new Map([...new Set(values)].sort((a, b) => a - b).map((value, index) => [value, index]))
}

function layout(bins: readonly RackBin[]): Placed[] {
  const zones = [...new Set(bins.map((bin) => bin.zone))].sort()
  const placed: Placed[] = []

  for (const [row, zone] of zones.entries()) {
    const inZone = bins.filter((bin) => bin.zone === zone)
    const levels = ranks(inZone.map((bin) => bin.shelfLevel))
    const columns = new Map<number, number>()

    for (const bin of inZone) {
      const level = levels.get(bin.shelfLevel) ?? 0
      const column = columns.get(level) ?? 0
      columns.set(level, column + 1)
      placed.push({ bin, row, column, level })
    }
  }

  return placed
}

function origin(places: readonly Placed[]): [number, number] {
  const width = Math.max(1, ...places.map((place) => place.column + 1))
  const rows = Math.max(1, ...places.map((place) => place.row + 1))

  return [((width - 1) * pitch) / 2, ((rows - 1) * rowGap) / 2]
}

function camera(places: readonly Placed[]): DrawingCamera {
  const width = Math.max(1, ...places.map((place) => place.column + 1)) * pitch
  const depth = Math.max(1, ...places.map((place) => place.row + 1)) * rowGap
  const height = Math.max(1, ...places.map((place) => place.level + 1)) * levelHeight

  return {
    position: [6, 4.6, 6],
    target: [0, height / 2, 0],
    viewHeight: Math.max(2.4, (width + depth) * 0.62, height * 1.5)
  }
}

function binRackModel(options: {
  reducedMotion: boolean
  bins: readonly RackBin[]
  clock?: () => number
}): BinRackModel {
  const clock = options.clock ?? (() => performance.now() / 1000)
  const pieces = new Map<string, MovingPiece>()
  const sizes = new Map<string, Vector3Tuple>()
  const listeners = new Set<() => void>()
  const framed = layout(options.bins.slice(0, drawnBins))
  const [frameX, frameZ] = origin(framed)
  let shelves: DrawingBox[] = []

  function scaled(seconds: number): number {
    return options.reducedMotion ? 0 : seconds
  }

  function show(bins: readonly RackBin[], selected: string | null): void {
    const places = layout(bins.slice(0, drawnBins))
    const [offsetX, offsetZ] = origin(places)
    const now = clock()
    const seen = new Set<string>()

    shelves = []

    const shelfKeys = new Set<string>()

    for (const place of places) {
      const x = place.column * pitch - offsetX
      const z = place.row * rowGap - offsetZ
      const floor = place.level * levelHeight
      const shelfKey = `${place.row}-${place.level}-${place.column}`

      if (!shelfKeys.has(shelfKey)) {
        shelfKeys.add(shelfKey)
        shelves.push({ id: `shelf-${shelfKey}`, center: [x, floor + shelfHalf[1], z], half: shelfHalf, accent: false })
      }

      const half = place.bin.stocked ? stockedHalf : emptyHalf
      const chosen = place.bin.code === selected
      const target: Vector3Tuple = [x, floor + shelfHalf[1] * 2 + half[1], z + (chosen ? pulled : 0)]
      const current = pieces.get(place.bin.code)
      const index = seen.size

      seen.add(place.bin.code)
      sizes.set(place.bin.code, half)

      if (current === undefined || current.leaving) {
        pieces.set(place.bin.code, {
          from: [target[0], target[1] + 1.2, target[2]],
          to: target,
          start: now + scaled(index * timing.step),
          duration: scaled(timing.arrive),
          lift: 0,
          accent: chosen,
          leaving: false
        })

        continue
      }

      if (!samePlace(current.to, target) || current.accent !== chosen) {
        pieces.set(place.bin.code, {
          from: positionOf(current, now),
          to: target,
          start: now,
          duration: scaled(timing.move),
          lift: 0,
          accent: chosen,
          leaving: false
        })
      }
    }

    for (const [code, piece] of pieces) {
      if (!seen.has(code) && !piece.leaving) {
        const from = positionOf(piece, now)
        pieces.set(code, {
          from,
          to: [from[0], from[1] + 1.2, from[2]],
          start: now,
          duration: scaled(timing.leave),
          lift: 0,
          accent: false,
          leaving: true
        })
      }
    }

    for (const listener of listeners) {
      listener()
    }
  }

  function frame(seconds: number): DrawingFrame {
    const boxes: DrawingBox[] = [...shelves]
    let settled = true

    for (const [code, piece] of pieces) {
      if (piece.leaving && arrived(piece, seconds)) {
        pieces.delete(code)
        sizes.delete(code)
        continue
      }

      if (!arrived(piece, seconds)) {
        settled = false
      }

      boxes.push({
        id: `bin-${code}`,
        center: positionOf(piece, seconds),
        half: sizes.get(code) ?? emptyHalf,
        accent: piece.accent
      })
    }

    return { boxes, turn: 0, settled }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)

    return () => listeners.delete(listener)
  }

  return {
    camera: camera(framed),
    floorHalf: Math.max(2, frameX + 1.4, frameZ + 1.4),
    frame,
    subscribe,
    show
  }
}

export { binRackModel }
