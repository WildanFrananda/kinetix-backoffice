import type { DrawingBox } from "./drawing_box.type"

type DrawingFrame = {
  boxes: readonly DrawingBox[]
  turn: number
  settled: boolean
}

export type { DrawingFrame }
