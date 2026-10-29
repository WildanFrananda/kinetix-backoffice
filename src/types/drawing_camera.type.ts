import type { Vector3Tuple } from "./vector3_tuple.type"

type DrawingCamera = {
  position: Vector3Tuple
  target: Vector3Tuple
  viewHeight: number
}

export type { DrawingCamera }
