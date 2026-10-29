type DrawingHandle = {
  resize: (width: number, height: number) => void
  setVisible: (visible: boolean) => void
  dispose: () => void
}

export type { DrawingHandle }
