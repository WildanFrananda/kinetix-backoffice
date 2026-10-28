type DrawingHandle = {
  resize: (width: number, height: number) => void
  setRunning: (running: boolean) => void
  dispose: () => void
}

export type { DrawingHandle }
