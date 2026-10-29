import { ListBox, ListBoxItem, Text } from "react-aria-components"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { WarehouseBin } from "../../types/warehouse_bin.type"
import { binSummary } from "./counted"
import styles from "./Stock.module.css"
import { useStockText } from "./stock_text"

function BinList({
  bins,
  selected,
  onSelect
}: {
  bins: readonly WarehouseBin[]
  selected: string | null
  onSelect: (code: string) => void
}) {
  const text = useStockText()
  const numbers = new Intl.NumberFormat(useLocale())

  return (
    <ListBox
      aria-label={text["stock.list.title"]}
      className={styles.list}
      items={bins.map((bin) => ({ id: bin.code, bin }))}
      selectionMode="single"
      selectionBehavior="replace"
      selectedKeys={selected === null ? [] : [selected]}
      onSelectionChange={(keys) => {
        if (keys === "all") {
          return
        }

        const [picked] = [...keys]
        if (typeof picked === "string") {
          onSelect(picked)
        }
      }}
    >
      {(item) => (
        <ListBoxItem id={item.id} textValue={item.bin.code} className={styles.item}>
          <Text slot="label" className={styles.itemName}>
            {item.bin.code}
          </Text>
          <span className={styles.itemUnits} data-empty={item.bin.skuCount === 0}>
            {item.bin.skuCount === 0
              ? text["stock.bin.empty"]
              : binSummary(text, item.bin.skuCount, item.bin.quantity, numbers)}
          </span>
          <Text slot="description" className={styles.itemMeta}>
            {formatText(text["stock.bin.place"], { zone: item.bin.zone, level: String(item.bin.shelfLevel) })}
          </Text>
        </ListBoxItem>
      )}
    </ListBox>
  )
}

export { BinList }
