import type { Vector3Tuple } from "./vector3_tuple.type"

type BoxFace = {
  normal: Vector3Tuple
  corners: [Vector3Tuple, Vector3Tuple, Vector3Tuple, Vector3Tuple]
}

export type { BoxFace }
