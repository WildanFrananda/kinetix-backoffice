import type { DrawingLoop } from "../types/drawing_loop.type"

function drawingLoop(draw: () => boolean): DrawingLoop {
  let visible = false
  let stopped = false
  let frame = 0

  function tick(): void {
    frame = 0

    if (stopped) {
      return
    }

    const settled = draw()
    if (visible && !settled) {
      frame = window.requestAnimationFrame(tick)
    }
  }

  function wake(): void {
    if (stopped || !visible || frame !== 0) {
      return
    }

    frame = window.requestAnimationFrame(tick)
  }

  function setVisible(next: boolean): void {
    visible = next
    if (visible) {
      wake()

      return
    }

    window.cancelAnimationFrame(frame)
    frame = 0
  }

  function stop(): void {
    stopped = true
    window.cancelAnimationFrame(frame)
    frame = 0
  }

  return { setVisible, wake, stop }
}

export { drawingLoop }
