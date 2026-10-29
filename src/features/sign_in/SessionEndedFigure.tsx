import { useCallback, useEffect, useRef, useState } from "react"
import { useText } from "../../i18n/use_text"
import { BrandMark } from "../../ui/BrandMark"
import { Drawing } from "../../ui/drawing/Drawing"
import { sessionFuseModel } from "../session/session_fuse_model"
import { idleSeconds } from "../session/session_lifetimes"
import styles from "./DrawingFigure.module.css"

const minutes = idleSeconds / 60

const pause = 600

const step = 120

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function SessionEndedFigure() {
  const text = useText()
  const [reducedMotion] = useState(prefersReducedMotion)
  const timers = useRef<number[]>([])
  const [model] = useState(() => {
    const fuse = sessionFuseModel({ reducedMotion, cells: minutes, columns: 5, viewHeight: 4.4 })
    fuse.show(reducedMotion ? 0 : minutes, true)

    return fuse
  })

  const runOut = useCallback(() => {
    if (reducedMotion || timers.current.length > 0) {
      return
    }

    timers.current = Array.from({ length: minutes }, (_, index) =>
      window.setTimeout(() => model.show(minutes - index - 1), pause + index * step)
    )
  }, [model, reducedMotion])

  useEffect(() => {
    return () => {
      for (const timer of timers.current) {
        window.clearTimeout(timer)
      }
    }
  }, [])

  return (
    <figure className={styles.figure} aria-hidden="true">
      <Drawing
        model={model}
        media="(min-width: 64rem)"
        className={styles.frame}
        fallback={<BrandMark size={96} />}
        onDrawn={runOut}
      />
      <figcaption className={styles.caption}>
        <span className={styles.number}>{text["signIn.endedFigureNumber"]}</span>
        <span>{text["signIn.endedFigureCaption"]}</span>
      </figcaption>
    </figure>
  )
}

export { SessionEndedFigure }
