import { useEffect, useRef, useState } from "react"
import { useText } from "../../i18n/use_text"
import type { DrawingColors } from "../../types/drawing_colors.type"
import type { DrawingHandle } from "../../types/drawing_handle.type"
import type { DrawingRenderer } from "../../types/drawing_renderer.type"
import type { DrawingState } from "../../types/drawing_state.type"
import { BrandMark } from "../../ui/BrandMark"
import styles from "./DrawingFigure.module.css"

const wideQuery = "(min-width: 64rem)"

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
  return import("../../three/drawing_scene")
}

function loadSvg() {
  return import("../../three/drawing_svg")
}

function DrawingFigure() {
  const text = useText()
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const surface = useRef<SVGSVGElement>(null)
  const [state, setState] = useState<DrawingState>("waiting")
  const [renderer, setRenderer] = useState<DrawingRenderer | null>(null)

  useEffect(() => {
    const holder = frame.current
    const glass = canvas.current
    const sheet = surface.current
    if (holder === null || glass === null || sheet === null || !window.matchMedia(wideQuery).matches) {
      return
    }

    const box = holder
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const stops: Array<() => void> = []
    let handle: DrawingHandle | null = null
    let cancelled = false

    function watch(mounted: DrawingHandle, chosen: DrawingRenderer): void {
      const sizer = new ResizeObserver(([entry]) => {
        if (entry !== undefined) {
          mounted.resize(entry.contentRect.width, entry.contentRect.height)
        }
      })

      const sight = new IntersectionObserver(([entry]) => mounted.setRunning(entry?.isIntersecting === true))

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
      const drawing = await loadWebgl()

      if (cancelled) {
        return true
      }

      try {
        watch(drawing.mountDrawing(target, { readColors, reducedMotion }), "webgl")
      } catch {
        return false
      }

      return true
    }

    async function mountSvg(target: SVGSVGElement): Promise<void> {
      const drawing = await loadSvg()

      if (cancelled) {
        return
      }

      const classes = { face: styles.face, accent: styles.accent, floor: styles.floor }
      watch(drawing.mountDrawing(target, { reducedMotion, classes }), "svg")
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
  }, [])

  return (
    <figure className={styles.figure} data-state={state} data-renderer={renderer ?? "none"} aria-hidden="true">
      <div ref={frame} className={styles.frame}>
        <canvas ref={canvas} className={styles.canvas} />
        <svg ref={surface} className={styles.drawing} />
        {state === "unavailable" ? (
          <span className={styles.fallback}>
            <BrandMark size={96} />
          </span>
        ) : null}
      </div>
      <figcaption className={styles.caption}>
        <span className={styles.number}>{text["signIn.figureNumber"]}</span>
        <span>{text["signIn.figureCaption"]}</span>
      </figcaption>
    </figure>
  )
}

export { DrawingFigure }
