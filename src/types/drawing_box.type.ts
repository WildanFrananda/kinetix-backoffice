import type { Vector3Tuple } from "./vector3_tuple.type"

type DrawingBox = {
  id: string
  center: Vector3Tuple
  half: Vector3Tuple
  accent: boolean
}

export type { DrawingBox }
