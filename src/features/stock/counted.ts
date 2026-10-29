import { formatText } from "../../i18n/format_text"
import type { StockCatalogue } from "../../types/stock_catalogue.type"

function counted(text: StockCatalogue, noun: "sku" | "unit", count: number, numbers: Intl.NumberFormat): string {
  const key = count === 1 ? (`stock.count.${noun}.one` as const) : (`stock.count.${noun}.other` as const)

  return formatText(text[key], { count: numbers.format(count) })
}

function binSummary(text: StockCatalogue, skus: number, units: number, numbers: Intl.NumberFormat): string {
  return formatText(text["stock.bin.summary"], {
    skus: counted(text, "sku", skus, numbers),
    units: counted(text, "unit", units, numbers)
  })
}

export { binSummary, counted }
