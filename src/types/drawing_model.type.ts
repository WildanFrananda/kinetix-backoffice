import type { DrawingCamera } from "./drawing_camera.type"
import type { DrawingFrame } from "./drawing_frame.type"

type DrawingModel = {
  camera: DrawingCamera
  floorHalf: number
  frame: (seconds: number) => DrawingFrame
  subscribe: (listener: () => void) => () => void
}

export type { DrawingModel }
