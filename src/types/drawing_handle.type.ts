import type { DrawingColors } from "./drawing_colors.type"

type DrawingHandle = {
  resize: (width: number, height: number) => void
  recolor: (colors: DrawingColors) => void
  setRunning: (running: boolean) => void
  dispose: () => void
}

export type { DrawingHandle }
