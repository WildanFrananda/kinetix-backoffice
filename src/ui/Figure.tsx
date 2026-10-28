import { animate, m, useMotionValue, useReducedMotion, useTransform } from "motion/react"
import { useEffect } from "react"
import { useLocale } from "../i18n/use_locale"
import styles from "./Figure.module.css"
import { easeOut } from "./motion/motion_presets"
import hidden from "./VisuallyHidden.module.css"

function Figure({
  label,
  value,
  more = false,
  tone = "neutral",
  note
}: {
  label: string
  value: number | null
  more?: boolean
  tone?: "neutral" | "attention"
  note?: string
}) {
  const locale = useLocale()
  const reduced = useReducedMotion()
  const counted = useMotionValue(0)
  const numbers = new Intl.NumberFormat(locale)
  const shown = useTransform(counted, (latest) => numbers.format(Math.round(latest)))
  const target = value ?? 0
  const spoken = value === null ? "—" : `${numbers.format(value)}${more ? "+" : ""}`

  useEffect(() => {
    if (reduced === true) {
      counted.jump(target)

      return
    }

    const controls = animate(counted, target, { duration: 0.7, ease: easeOut })

    return () => controls.stop()
  }, [counted, reduced, target])

  return (
    <div className={styles.figure} data-tone={target > 0 ? tone : "neutral"}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>
        <span aria-hidden="true">
          {value === null ? "—" : <m.span>{shown}</m.span>}
          {more ? "+" : null}
        </span>
        <span className={hidden.hidden}>{spoken}</span>
      </dd>
      {note === undefined ? null : <dd className={styles.note}>{note}</dd>}
    </div>
  )
}

export { Figure }
