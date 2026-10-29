import { useState } from "react"
import { useText } from "../../i18n/use_text"
import { rackModel } from "../../three/rack_model"
import { BrandMark } from "../../ui/BrandMark"
import { Drawing } from "../../ui/drawing/Drawing"
import styles from "./DrawingFigure.module.css"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function DrawingFigure() {
  const text = useText()
  const [model] = useState(() => rackModel(prefersReducedMotion()))

  return (
    <figure className={styles.figure} aria-hidden="true">
      <Drawing model={model} media="(min-width: 64rem)" className={styles.frame} fallback={<BrandMark size={96} />} />
      <figcaption className={styles.caption}>
        <span className={styles.number}>{text["signIn.figureNumber"]}</span>
        <span>{text["signIn.figureCaption"]}</span>
      </figcaption>
    </figure>
  )
}

export { DrawingFigure }
