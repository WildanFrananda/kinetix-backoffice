import { useRouterState } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import styles from "../VisuallyHidden.module.css"

function RouteAnnouncer() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [message, setMessage] = useState("")
  const previous = useRef(pathname)

  useEffect(() => {
    if (previous.current === pathname) {
      return
    }

    previous.current = pathname

    function focusHeading(): void {
      const heading = document.querySelector<HTMLElement>("main [data-page-title]")
      if (heading === null) {
        return
      }

      heading.focus()
      setMessage(heading.textContent ?? "")
    }

    function refocusAfterOverlays(): void {
      const active = document.activeElement
      const main = document.querySelector("main")
      if (active === null || active === document.body || main === null || !main.contains(active)) {
        focusHeading()
      }
    }

    const frame = window.requestAnimationFrame(focusHeading)
    const settle = window.setTimeout(refocusAfterOverlays, 400)

    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(settle)
    }
  }, [pathname])

  return (
    <p className={styles.hidden} aria-live="polite" aria-atomic="true">
      {message}
    </p>
  )
}

export { RouteAnnouncer }
