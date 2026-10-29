import { type ReactNode, useEffect, useRef, useState } from "react"
import type { DrawingColors } from "../../types/drawing_colors.type"
import type { DrawingHandle } from "../../types/drawing_handle.type"
import type { DrawingModel } from "../../types/drawing_model.type"
import type { DrawingRenderer } from "../../types/drawing_renderer.type"
import type { DrawingState } from "../../types/drawing_state.type"
import styles from "./Drawing.module.css"

function readColors(): DrawingColors {
  const style = getComputedStyle(document.documentElement)

  return {
    ink: style.getPropertyValue("--kx-fg").trim(),
    paper: style.getPropertyValue("--kx-bg").trim(),
    accent: style.getPropertyValue("--kx-accent").trim(),
    rule: style.getPropertyValue("--kx-rule-strong").trim()
  }
}

function supportsWebgl2(): boolean {
  try {
    const probe = document.createElement("canvas").getContext("webgl2")
    probe?.getExtension("WEBGL_lose_context")?.loseContext()

    return probe !== null
  } catch {
    return false
  }
}

function loadWebgl() {
  return import("../../three/webgl_painter")
}

function loadSvg() {
  return import("../../three/svg_painter")
}

function Drawing({
  model,
  media,
  className,
  fallback
}: {
  model: DrawingModel
  media: string
  className?: string
  fallback: ReactNode
}) {
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const surface = useRef<SVGSVGElement>(null)
  const [state, setState] = useState<DrawingState>("waiting")
  const [renderer, setRenderer] = useState<DrawingRenderer | null>(null)

  useEffect(() => {
    const holder = frame.current
    const glass = canvas.current
    const sheet = surface.current
    if (holder === null || glass === null || sheet === null || !window.matchMedia(media).matches) {
      return
    }

    const box = holder
    const stops: Array<() => void> = []
    let handle: DrawingHandle | null = null
    let cancelled = false

    function watch(mounted: DrawingHandle, chosen: DrawingRenderer): void {
      const sizer = new ResizeObserver(([entry]) => {
        if (entry !== undefined) {
          mounted.resize(entry.contentRect.width, entry.contentRect.height)
        }
      })

      const sight = new IntersectionObserver(([entry]) => mounted.setVisible(entry?.isIntersecting === true))

      sizer.observe(box)
      sight.observe(box)
      stops.push(
        () => sizer.disconnect(),
        () => sight.disconnect()
      )

      handle = mounted
      setRenderer(chosen)
      setState("drawn")
    }

    async function mountWebgl(target: HTMLCanvasElement): Promise<boolean> {
      const painter = await loadWebgl()

      if (cancelled) {
        return true
      }

      try {
        watch(painter.mountDrawing(target, { model, readColors }), "webgl")
      } catch {
        return false
      }

      return true
    }

    async function mountSvg(target: SVGSVGElement): Promise<void> {
      const painter = await loadSvg()

      if (cancelled) {
        return
      }

      const classes = { face: styles.face, accent: styles.accent, floor: styles.floor }
      watch(painter.mountDrawing(target, { model, classes }), "svg")
    }

    async function mount(gl: HTMLCanvasElement, svg: SVGSVGElement): Promise<void> {
      if (supportsWebgl2() && (await mountWebgl(gl).catch(() => false))) {
        return
      }

      await mountSvg(svg)
    }

    const timer = window.setTimeout(() => {
      mount(glass, sheet).catch(() => setState("unavailable"))
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)

      for (const stop of stops) {
        stop()
      }

      handle?.dispose()
    }
  }, [model, media])

  return (
    <div
      ref={frame}
      className={className === undefined ? styles.frame : `${styles.frame} ${className}`}
      data-state={state}
      data-renderer={renderer ?? "none"}
      aria-hidden="true"
    >
      <canvas ref={canvas} className={styles.canvas} />
      <svg ref={surface} className={styles.drawing} />
      {state === "unavailable" ? <span className={styles.fallback}>{fallback}</span> : null}
    </div>
  )
}

export { Drawing }
