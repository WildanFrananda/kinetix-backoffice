import type { Group } from "three"
import type { LineSegments2 } from "three/addons/lines/LineSegments2.js"

type DrawingPiece = {
  holder: Group
  outline: LineSegments2
}

export type { DrawingPiece }
