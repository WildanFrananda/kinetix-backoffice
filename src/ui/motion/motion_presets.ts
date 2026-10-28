import type { Transition } from "motion/react"

const easeOut: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

const easeIn: [number, number, number, number] = [0.4, 0, 1, 1]

const enter: Transition = { duration: 0.24, ease: easeOut }

const exit: Transition = { duration: 0.12, ease: easeIn }

const settle: Transition = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 }

const stagger = 0.045

export { easeIn, easeOut, enter, exit, settle, stagger }
