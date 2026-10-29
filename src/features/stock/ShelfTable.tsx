import { Button as PlainButton } from "react-aria-components"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { StockRow } from "../../types/stock_row.type"
import { PlusMinus } from "../../ui/icons/PlusMinus"
import styles from "./Stock.module.css"
import { shortPrincipal } from "./short_principal"
import { useStockText } from "./stock_text"

function ShelfTable({ rows, onAdjust }: { rows: readonly StockRow[]; onAdjust: (row: StockRow) => void }) {
  const text = useStockText()
  const numbers = new Intl.NumberFormat(useLocale())

  return (
    <div className={styles.tableFrame}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">{text["stock.column.sku"]}</th>
            <th scope="col">{text["stock.column.owner"]}</th>
            <th scope="col" className={styles.number}>
              {text["stock.column.onHand"]}
            </th>
            <th scope="col" className={styles.number}>
              {text["stock.column.reserved"]}
            </th>
            <th scope="col" className={styles.number}>
              {text["stock.column.available"]}
            </th>
            <th scope="col">
              <span className={styles.hidden}>{text["stock.column.actions"]}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} data-empty={row.quantity === 0}>
              <th scope="row" className={styles.sku}>
                {row.sku}
              </th>
              <td className={styles.owner} title={row.merchantPrincipalId ?? undefined}>
                {row.merchantPrincipalId === null ? text["stock.row.noOwner"] : shortPrincipal(row.merchantPrincipalId)}
              </td>
              <td className={styles.number}>{numbers.format(row.quantity)}</td>
              <td className={styles.number}>{numbers.format(row.reserved)}</td>
              <td className={styles.number}>{numbers.format(row.available)}</td>
              <td className={styles.rowAction}>
                <PlainButton
                  className={styles.adjust}
                  aria-label={formatText(text["stock.row.adjustLabel"], { sku: row.sku })}
                  onPress={() => onAdjust(row)}
                >
                  <PlusMinus aria-hidden="true" />
                  <span aria-hidden="true">{text["stock.row.adjust"]}</span>
                </PlainButton>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export { ShelfTable }
