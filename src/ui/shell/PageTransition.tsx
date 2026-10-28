import { useRouterState } from "@tanstack/react-router"
import { m } from "motion/react"
import type { ReactNode } from "react"
import { enter } from "../motion/motion_presets"

function PageTransition({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return (
    <m.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={enter}>
      {children}
    </m.div>
  )
}

export { PageTransition }
