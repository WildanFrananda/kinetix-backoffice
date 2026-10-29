import type { DrawingBox } from "../types/drawing_box.type"
import type { DrawingFrame } from "../types/drawing_frame.type"
import type { DrawingModel } from "../types/drawing_model.type"
import type { DrawingPart } from "../types/drawing_part.type"
import { drawingParts } from "./drawing_parts"

const assembleSeconds = 1.8

const stepSeconds = 0.07

const turnSeconds = 72

const startTurn = -0.38

function easeOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))

  return 1 - (1 - clamped) ** 3
}

function placed(part: DrawingPart, index: number, elapsed: number, reducedMotion: boolean): DrawingBox {
  const progress = reducedMotion ? 1 : easeOutCubic((elapsed - index * stepSeconds) / assembleSeconds)
  const spread = 1 - progress

  return {
    id: `part-${index}`,
    center: [
      part.home[0] + part.offset[0] * spread,
      part.home[1] + part.offset[1] * spread,
      part.home[2] + part.offset[2] * spread
    ],
    half: [part.size[0] / 2, part.size[1] / 2, part.size[2] / 2],
    accent: part.accent
  }
}

function rackModel(reducedMotion: boolean): DrawingModel {
  let startedAt: number | null = null

  function frame(seconds: number): DrawingFrame {
    startedAt ??= seconds

    const elapsed = seconds - startedAt

    return {
      boxes: drawingParts.map((part, index) => placed(part, index, elapsed, reducedMotion)),
      turn: reducedMotion ? startTurn : startTurn + ((elapsed / turnSeconds) % 1) * Math.PI * 2,
      settled: reducedMotion
    }
  }

  function subscribe(): () => void {
    return () => undefined
  }

  return {
    camera: { position: [6, 4.6, 6], target: [0, 1.15, 0], viewHeight: 4.9 },
    floorHalf: 2.5,
    frame,
    subscribe
  }
}

export { rackModel }
