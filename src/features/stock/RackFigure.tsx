import { useEffect, useMemo, useState } from "react"
import { useLocale } from "../../i18n/use_locale"
import type { WarehouseBin } from "../../types/warehouse_bin.type"
import { Drawing } from "../../ui/drawing/Drawing"
import { Package } from "../../ui/icons/Package"
import { binRackModel } from "./bin_rack_model"
import styles from "./Stock.module.css"
import { useStockText } from "./stock_text"

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function RackFigure({ bins, selected }: { bins: readonly WarehouseBin[]; selected: string | null }) {
  const text = useStockText()
  const numbers = new Intl.NumberFormat(useLocale())
  const rack = useMemo(
    () =>
      bins.map((bin) => ({ code: bin.code, zone: bin.zone, shelfLevel: bin.shelfLevel, stocked: bin.skuCount > 0 })),
    [bins]
  )

  const [model] = useState(() => binRackModel({ reducedMotion: prefersReducedMotion(), bins: rack }))

  useEffect(() => {
    model.show(rack, selected)
  }, [model, rack, selected])

  const figures = [
    { label: text["stock.figure.bins"], value: bins.length },
    { label: text["stock.figure.stocked"], value: bins.filter((bin) => bin.skuCount > 0).length },
    { label: text["stock.figure.units"], value: bins.reduce((sum, bin) => sum + bin.quantity, 0) },
    { label: text["stock.figure.reserved"], value: bins.reduce((sum, bin) => sum + bin.reserved, 0) }
  ]

  return (
    <figure className={styles.figure}>
      <Drawing
        model={model}
        media="(min-width: 64rem)"
        className={styles.drawing}
        fallback={<Package size={56} weight="thin" />}
      />
      <dl className={styles.figures}>
        {figures.map((figure) => (
          <div key={figure.label} className={styles.figureItem}>
            <dt>{figure.label}</dt>
            <dd>{numbers.format(figure.value)}</dd>
          </div>
        ))}
      </dl>
    </figure>
  )
}

export { RackFigure }
