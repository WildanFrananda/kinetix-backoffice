import { LazyMotion, MotionConfig } from "motion/react"
import type { ReactNode } from "react"
import { enter } from "./motion_presets"

function loadFeatures() {
  return import("./motion_features").then((module) => module.domAnimation)
}

function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user" transition={enter}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

export { MotionProvider }
