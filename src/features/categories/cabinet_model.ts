import { arrived, positionOf, samePlace } from "../../three/moving_piece"
import type { CabinetModel } from "../../types/cabinet_model.type"
import type { DrawingBox } from "../../types/drawing_box.type"
import type { MovingPiece } from "../../types/moving_piece.type"
import type { Vector3Tuple } from "../../types/vector3_tuple.type"

const drawnDrawers = 48

const drawerHalf: Vector3Tuple = [0.42, 0.15, 0.3]

const pitchX = 0.92

const pitchY = 0.36

const plinthHeight = 0.05

const pulled = 0.46

const timing = { arrive: 0.5, move: 0.4, leave: 0.4, step: 0.03 }

function cabinetShape(count: number): { columns: number; rows: number } {
  const columns = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(Math.max(1, count)))))

  return { columns, rows: Math.max(1, Math.ceil(count / columns)) }
}

function cabinetModel(options: { reducedMotion: boolean; capacity: number; clock?: () => number }): CabinetModel {
  const clock = options.clock ?? (() => performance.now() / 1000)
  const pieces = new Map<string, MovingPiece>()
  const listeners = new Set<() => void>()
  const { columns, rows } = cabinetShape(Math.min(drawnDrawers, options.capacity))
  const width = columns * pitchX
  const height = rows * pitchY + plinthHeight
  const plinth: DrawingBox = {
    id: "plinth",
    center: [0, plinthHeight / 2, 0],
    half: [width / 2, plinthHeight / 2, drawerHalf[2] + 0.02],
    accent: false
  }

  function scaled(seconds: number): number {
    return options.reducedMotion ? 0 : seconds
  }

  function place(index: number, chosen: boolean): Vector3Tuple {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = column * pitchX - ((columns - 1) * pitchX) / 2
    const y = plinthHeight + (rows - 1 - row) * pitchY + drawerHalf[1] + 0.01

    return [x, y, chosen ? pulled : 0]
  }

  function show(drawers: readonly string[], selected: string | null): void {
    const now = clock()
    const shown = drawers.slice(0, Math.min(drawnDrawers, columns * rows))
    const seen = new Set(shown)

    for (const [index, name] of shown.entries()) {
      const chosen = name === selected
      const target = place(index, chosen)
      const current = pieces.get(name)

      if (current === undefined || current.leaving) {
        pieces.set(name, {
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
        pieces.set(name, {
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

    for (const [name, piece] of pieces) {
      if (!seen.has(name) && !piece.leaving) {
        const from = positionOf(piece, now)
        pieces.set(name, {
          from,
          to: [from[0], from[1] + 1.2, from[2] + 0.4],
          start: now,
          duration: scaled(timing.leave),
          lift: 0,
          accent: true,
          leaving: true
        })
      }
    }

    for (const listener of listeners) {
      listener()
    }
  }

  function frame(seconds: number) {
    const boxes: DrawingBox[] = [plinth]
    let settled = true

    for (const [name, piece] of pieces) {
      if (piece.leaving && arrived(piece, seconds)) {
        pieces.delete(name)
        continue
      }

      if (!arrived(piece, seconds)) {
        settled = false
      }

      boxes.push({ id: `drawer-${name}`, center: positionOf(piece, seconds), half: drawerHalf, accent: piece.accent })
    }

    return { boxes, turn: 0, settled }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)

    return () => listeners.delete(listener)
  }

  return {
    camera: {
      position: [6, 4.6, 6],
      target: [0, height / 2, pulled / 2],
      viewHeight: Math.max(2.2, height * 1.45, width * 0.9)
    },
    floorHalf: Math.max(2, width / 2 + 1.2),
    frame,
    subscribe,
    show
  }
}

export { cabinetModel, cabinetShape }
