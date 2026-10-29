import { arrived, positionOf } from "../../three/moving_piece"
import type { DrawingBox } from "../../types/drawing_box.type"
import type { DrawingFrame } from "../../types/drawing_frame.type"
import type { MovingPiece } from "../../types/moving_piece.type"
import type { SessionFuseModel } from "../../types/session_fuse_model.type"
import type { Vector3Tuple } from "../../types/vector3_tuple.type"

const spacing = 0.5

const padHalf: Vector3Tuple = [0.17, 0.015, 0.17]

const cubeHalf: Vector3Tuple = [0.15, 0.15, 0.15]

const timing = { arrive: 0.45, leave: 0.55, step: 0.045 }

function slot(index: number, cells: number): [number, number] {
  const offset = (index - (cells - 1) / 2) * spacing

  return [offset / Math.SQRT2, -offset / Math.SQRT2]
}

function resting(index: number, cells: number): Vector3Tuple {
  const [x, z] = slot(index, cells)

  return [x, padHalf[1] * 2 + cubeHalf[1], z]
}

function sessionFuseModel(options: { reducedMotion: boolean; cells: number; clock?: () => number }): SessionFuseModel {
  const clock = options.clock ?? (() => performance.now() / 1000)
  const cubes = new Map<number, MovingPiece>()
  const listeners = new Set<() => void>()
  let shown = 0

  const pads: readonly DrawingBox[] = Array.from({ length: options.cells }, (_, index) => {
    const [x, z] = slot(index, options.cells)

    return { id: `pad-${index}`, center: [x, padHalf[1], z], half: padHalf, accent: false }
  })

  function scaled(seconds: number): number {
    return options.reducedMotion ? 0 : seconds
  }

  function show(minutesLeft: number): void {
    const wanted = Math.max(0, Math.min(options.cells, Math.round(minutesLeft)))
    const now = clock()

    for (let index = 0; index < options.cells; index += 1) {
      const cube = cubes.get(index)
      const target = resting(index, options.cells)

      if (index < wanted && (cube === undefined || cube.leaving)) {
        const from: Vector3Tuple = cube === undefined ? [target[0], target[1] + 1.1, target[2]] : positionOf(cube, now)
        const delay = Math.max(0, index - shown) * timing.step
        cubes.set(index, {
          from,
          to: target,
          start: now + scaled(delay),
          duration: scaled(timing.arrive),
          lift: 0,
          accent: false,
          leaving: false
        })

        continue
      }

      if (index >= wanted && cube !== undefined && !cube.leaving) {
        const from = positionOf(cube, now)
        cubes.set(index, {
          from,
          to: [from[0], from[1] + 1.3, from[2]],
          start: now,
          duration: scaled(timing.leave),
          lift: 0,
          accent: true,
          leaving: true
        })
      }
    }

    for (const [index, cube] of cubes) {
      if (!cube.leaving) {
        cube.accent = index === wanted - 1
      }
    }

    shown = wanted

    for (const listener of listeners) {
      listener()
    }
  }

  function frame(seconds: number): DrawingFrame {
    const boxes: DrawingBox[] = [...pads]
    let settled = true

    for (const [index, cube] of cubes) {
      if (cube.leaving && arrived(cube, seconds)) {
        cubes.delete(index)
        continue
      }

      if (!arrived(cube, seconds)) {
        settled = false
      }

      boxes.push({ id: `cube-${index}`, center: positionOf(cube, seconds), half: cubeHalf, accent: cube.accent })
    }

    return { boxes, turn: 0, settled }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)

    return () => listeners.delete(listener)
  }

  return {
    camera: { position: [6, 4.6, 6], target: [0, 0.15, 0], viewHeight: 2.6 },
    floorHalf: 3,
    frame,
    subscribe,
    show
  }
}

export { sessionFuseModel }
