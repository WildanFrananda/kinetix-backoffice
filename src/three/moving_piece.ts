import type { MovingPiece } from "../types/moving_piece.type"
import type { Vector3Tuple } from "../types/vector3_tuple.type"

function easeInOutCubic(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress))

  return clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2
}

function positionOf(piece: MovingPiece, seconds: number): Vector3Tuple {
  const progress = piece.duration <= 0 ? 1 : (seconds - piece.start) / piece.duration
  const eased = easeInOutCubic(progress)
  const arc = piece.lift * 4 * eased * (1 - eased)

  return [
    piece.from[0] + (piece.to[0] - piece.from[0]) * eased,
    piece.from[1] + (piece.to[1] - piece.from[1]) * eased + arc,
    piece.from[2] + (piece.to[2] - piece.from[2]) * eased
  ]
}

function arrived(piece: MovingPiece, seconds: number): boolean {
  return seconds >= piece.start + piece.duration
}

function samePlace(a: Vector3Tuple, b: Vector3Tuple): boolean {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 1e-6
}

export { arrived, positionOf, samePlace }
