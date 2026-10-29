import { m } from "motion/react"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { StockReport } from "../../types/stock_report.type"
import { enter } from "../../ui/motion/motion_presets"
import { Notice } from "../../ui/Notice"
import styles from "./Stock.module.css"
import { useStockText } from "./stock_text"

function StockNotice({ report }: { report: StockReport | null }) {
  const text = useStockText()
  const numbers = new Intl.NumberFormat(useLocale())

  if (report === null) {
    return null
  }

  function sentence(shown: StockReport): string {
    switch (shown.kind) {
      case "received":
      case "replayed":
        return formatText(text[shown.kind === "received" ? "stock.done.received" : "stock.done.replayed"], {
          quantity: numbers.format(shown.quantity),
          sku: shown.sku,
          bin: shown.bin,
          onHand: numbers.format(shown.onHand)
        })
      case "adjusted":
        return formatText(text["stock.done.adjusted"], {
          sku: shown.sku,
          bin: shown.bin,
          onHand: numbers.format(shown.onHand)
        })
      case "savedBin":
        return formatText(text["stock.done.savedBin"], { bin: shown.bin })
    }
  }

  return (
    <m.div
      key={JSON.stringify(report)}
      className={styles.notice}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={enter}
    >
      <Notice tone="info">{sentence(report)}</Notice>
    </m.div>
  )
}

export { StockNotice }
