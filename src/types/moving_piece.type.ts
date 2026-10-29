import type { Vector3Tuple } from "./vector3_tuple.type"

type MovingPiece = {
  from: Vector3Tuple
  to: Vector3Tuple
  start: number
  duration: number
  lift: number
  accent: boolean
  leaving: boolean
}

export type { MovingPiece }
