import { arrived, positionOf, samePlace } from "../../three/moving_piece"
import type { DecisionOutcome } from "../../types/decision_outcome.type"
import type { DrawingBox } from "../../types/drawing_box.type"
import type { DrawingFrame } from "../../types/drawing_frame.type"
import type { MovingPiece } from "../../types/moving_piece.type"
import type { TrayModel } from "../../types/tray_model.type"
import type { TrayState } from "../../types/tray_state.type"
import type { Vector3Tuple } from "../../types/vector3_tuple.type"

const shownPending = 20

const keptDecided = 16

const pitch = 0.042

const sheetHalf: Vector3Tuple = [0.5, 0.005, 0.36]

const trayHalf: [number, number] = [0.7, 0.55]

const baseHeight = 0.05

const wallHeight = 0.12

const wallThickness = 0.03

const spacing = 2.1

const timing = { decide: 0.8, settle: 0.36, arrive: 0.5, leave: 0.4, step: 0.035 }

function trayBoxes(name: string, [x, z]: readonly [number, number]): DrawingBox[] {
  const [halfX, halfZ] = trayHalf
  const wallY = baseHeight + wallHeight / 2
  const halfWall = wallThickness / 2

  return [
    { id: `${name}-base`, center: [x, baseHeight / 2, z], half: [halfX, baseHeight / 2, halfZ], accent: false },
    {
      id: `${name}-back`,
      center: [x, wallY, z - halfZ + halfWall],
      half: [halfX, wallHeight / 2, halfWall],
      accent: false
    },
    {
      id: `${name}-front`,
      center: [x, wallY, z + halfZ - halfWall],
      half: [halfX, wallHeight / 2, halfWall],
      accent: false
    },
    {
      id: `${name}-left`,
      center: [x - halfX + halfWall, wallY, z],
      half: [halfWall, wallHeight / 2, halfZ - wallThickness],
      accent: false
    },
    {
      id: `${name}-right`,
      center: [x + halfX - halfWall, wallY, z],
      half: [halfWall, wallHeight / 2, halfZ - wallThickness],
      accent: false
    }
  ]
}

function onScreenAxis(offset: number): [number, number] {
  return [offset / Math.SQRT2, -offset / Math.SQRT2]
}

function trayPlaces(outcomes: readonly DecisionOutcome[]): Record<"pending" | DecisionOutcome, [number, number]> {
  if (outcomes.includes("rejected")) {
    return {
      pending: onScreenAxis(-spacing),
      approved: onScreenAxis(0),
      rejected: onScreenAxis(spacing)
    }
  }

  return {
    pending: onScreenAxis(-spacing / 2),
    approved: onScreenAxis(spacing / 2),
    rejected: onScreenAxis(spacing * 2)
  }
}

function stacked([x, z]: readonly [number, number], level: number): Vector3Tuple {
  return [x, baseHeight + sheetHalf[1] + 0.004 + level * pitch, z]
}

function trayModel(options: {
  reducedMotion: boolean
  outcomes: readonly DecisionOutcome[]
  clock?: () => number
}): TrayModel {
  const clock = options.clock ?? (() => performance.now() / 1000)
  const trays = trayPlaces(options.outcomes)
  const fixtures: readonly DrawingBox[] = [
    ...trayBoxes("tray-pending", trays.pending),
    ...options.outcomes.flatMap((outcome) => trayBoxes(`tray-${outcome}`, trays[outcome]))
  ]

  const sheets = new Map<string, MovingPiece>()
  const listeners = new Set<() => void>()
  const decided: Record<DecisionOutcome, string[]> = { approved: [], rejected: [] }
  let state: TrayState = { pending: [], selected: null }
  let shownOnce = false

  function scaled(seconds: number): number {
    return options.reducedMotion ? 0 : seconds
  }

  function targets(): Map<string, { at: Vector3Tuple; accent: boolean }> {
    const placed = new Map<string, { at: Vector3Tuple; accent: boolean }>()
    const settled = new Set([...decided.approved, ...decided.rejected])
    const waiting = state.pending.filter((id) => !settled.has(id)).slice(0, shownPending)
    const top = stacked(trays.pending, waiting.length - 1)

    waiting.forEach((id, index) => {
      if (id === state.selected) {
        const above = Math.max(top[1] + 0.12, baseHeight + wallHeight + sheetHalf[1] + 0.04)
        placed.set(id, { at: [top[0], above, top[2] + 0.42], accent: true })

        return
      }

      placed.set(id, { at: stacked(trays.pending, waiting.length - 1 - index), accent: false })
    })

    for (const outcome of options.outcomes) {
      decided[outcome].forEach((id, level) => {
        placed.set(id, { at: stacked(trays[outcome], level), accent: false })
      })
    }

    return placed
  }

  function retarget(id: string, to: Vector3Tuple, timings: { duration: number; lift: number; delay: number }): void {
    const now = clock()
    const sheet = sheets.get(id)
    if (sheet === undefined) {
      return
    }

    if (samePlace(sheet.to, to) && !sheet.leaving) {
      return
    }

    sheets.set(id, {
      ...sheet,
      from: positionOf(sheet, now),
      to,
      start: now + scaled(timings.delay),
      duration: scaled(timings.duration),
      lift: timings.lift,
      leaving: false
    })
  }

  function layout(moving: string | null): void {
    const now = clock()
    const placed = targets()
    let arriving = 0

    for (const [id, target] of placed) {
      const sheet = sheets.get(id)
      if (sheet === undefined) {
        const from: Vector3Tuple = [target.at[0], target.at[1] + 1.2, target.at[2]]
        const delay = shownOnce ? 0 : arriving * timing.step
        sheets.set(id, {
          from,
          to: target.at,
          start: now + scaled(delay),
          duration: scaled(timing.arrive),
          lift: 0,
          accent: target.accent,
          leaving: false
        })

        arriving += 1
        continue
      }

      sheet.accent = target.accent
      const decision = id === moving
      retarget(id, target.at, {
        duration: decision ? timing.decide : timing.settle,
        lift: decision ? 0.7 : 0,
        delay: 0
      })
    }

    for (const [id, sheet] of sheets) {
      if (placed.has(id) || sheet.leaving) {
        continue
      }

      const from = positionOf(sheet, now)
      sheets.set(id, {
        ...sheet,
        from,
        to: [from[0], from[1] + 1.6, from[2]],
        start: now,
        duration: scaled(timing.leave),
        lift: 0,
        accent: false,
        leaving: true
      })
    }

    shownOnce = true

    for (const listener of listeners) {
      listener()
    }
  }

  function show(next: TrayState): void {
    state = { pending: [...next.pending], selected: next.selected }
    layout(null)
  }

  function decide(id: string, outcome: DecisionOutcome): void {
    for (const list of Object.values(decided)) {
      const index = list.indexOf(id)
      if (index >= 0) {
        list.splice(index, 1)
      }
    }

    decided[outcome].push(id)
    decided[outcome].splice(0, Math.max(0, decided[outcome].length - keptDecided))

    if (state.selected === id) {
      state = { ...state, selected: null }
    }

    layout(id)
  }

  function frame(seconds: number): DrawingFrame {
    const boxes: DrawingBox[] = [...fixtures]
    let settled = true

    for (const [id, sheet] of sheets) {
      if (sheet.leaving && arrived(sheet, seconds)) {
        sheets.delete(id)
        continue
      }

      if (!arrived(sheet, seconds)) {
        settled = false
      }

      boxes.push({ id: `sheet-${id}`, center: positionOf(sheet, seconds), half: sheetHalf, accent: sheet.accent })
    }

    return { boxes, turn: 0, settled }
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener)

    return () => listeners.delete(listener)
  }

  return {
    camera: { position: [6, 4.6, 6], target: [0, 0.4, 0], viewHeight: 2.45 },
    floorHalf: 2.5,
    frame,
    subscribe,
    show,
    decide
  }
}

export { trayModel }
