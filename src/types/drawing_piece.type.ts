import type { Group } from "three"
import type { DrawingPart } from "./drawing_part.type"

type DrawingPiece = {
  part: DrawingPart
  holder: Group
}

export type { DrawingPiece }
