import { m } from "motion/react"
import { formatText } from "../../i18n/format_text"
import type { CategoryReport } from "../../types/category_report.type"
import { enter } from "../../ui/motion/motion_presets"
import { Notice } from "../../ui/Notice"
import styles from "./Categories.module.css"
import { useCategoriesText } from "./categories_text"

function CategoryNotice({ report }: { report: CategoryReport | null }) {
  const text = useCategoriesText()

  if (report === null) {
    return null
  }

  return (
    <m.div
      key={`${report.kind}-${report.id}-${report.name}`}
      className={styles.notice}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enter}
    >
      <Notice tone="info">{formatText(text[`categories.done.${report.kind}`], { name: report.name })}</Notice>
    </m.div>
  )
}

export { CategoryNotice }
