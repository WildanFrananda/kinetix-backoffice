import { useEffect, useState } from "react"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { Category } from "../../types/category.type"
import { Drawing } from "../../ui/drawing/Drawing"
import { Tag } from "../../ui/icons/Tag"
import styles from "./Categories.module.css"
import { cabinetModel } from "./cabinet_model"
import { useCategoriesText } from "./categories_text"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function CabinetFigure({
  categories,
  capacity,
  selected
}: {
  categories: readonly Category[]
  capacity: number
  selected: number | null
}) {
  const text = useCategoriesText()
  const numbers = new Intl.NumberFormat(useLocale())
  const [model] = useState(() => cabinetModel({ reducedMotion: prefersReducedMotion(), capacity }))

  useEffect(() => {
    model.show(
      categories.map((category) => String(category.id)),
      selected === null ? null : String(selected)
    )
  }, [model, categories, selected])

  return (
    <figure className={styles.figure}>
      <Drawing
        model={model}
        media="(min-width: 64rem)"
        className={styles.drawing}
        fallback={<Tag size={56} weight="thin" />}
      />
      <figcaption className={styles.caption}>
        {formatText(text["categories.figure.caption"], { count: numbers.format(categories.length) })}
      </figcaption>
    </figure>
  )
}

export { CabinetFigure }
