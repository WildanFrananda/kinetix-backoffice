import { useEffect, useRef, useState } from "react"
import { useText } from "../../i18n/use_text"
import type { Disposable } from "../../types/disposable.type"
import type { DrawingColors } from "../../types/drawing_colors.type"
import type { DrawingHandle } from "../../types/drawing_handle.type"
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

function loadScene() {
  return import("../../three/drawing_scene")
}

function DrawingFigure() {
  const text = useText()
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<DrawingState>("waiting")

  useEffect(() => {
    const holder = frame.current
    const surface = canvas.current
    if (holder === null || surface === null || !window.matchMedia(wideQuery).matches) {
      return
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const observers: Disposable[] = []
    let handle: DrawingHandle | null = null
    let cancelled = false

    function mount(scene: Awaited<ReturnType<typeof loadScene>>, target: HTMLCanvasElement, box: HTMLDivElement): void {
      if (cancelled) {
        return
      }

      try {
        handle = scene.mountDrawing(target, { colors: readColors(), reducedMotion })
      } catch {
        setState("unavailable")

        return
      }

      const mounted = handle
      const sizer = new ResizeObserver(([entry]) => {
        if (entry !== undefined) {
          mounted.resize(entry.contentRect.width, entry.contentRect.height)
        }
      })

      const theme = new MutationObserver(() => mounted.recolor(readColors()))
      const sight = new IntersectionObserver(([entry]) => mounted.setRunning(entry?.isIntersecting === true))

      sizer.observe(box)
      theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
      sight.observe(box)
      observers.push(
        { dispose: () => sizer.disconnect() },
        { dispose: () => theme.disconnect() },
        { dispose: () => sight.disconnect() }
      )

      setState("drawn")
    }

    const timer = window.setTimeout(() => {
      loadScene().then(
        (scene) => mount(scene, surface, holder),
        () => setState("unavailable")
      )
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)

      for (const observer of observers) {
        observer.dispose()
      }

      handle?.dispose()
    }
  }, [])

  return (
    <figure className={styles.figure} data-state={state} aria-hidden="true">
      <div ref={frame} className={styles.frame}>
        <canvas ref={canvas} className={styles.canvas} />
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
