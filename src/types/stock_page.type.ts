import type { StockRow } from "./stock_row.type"

type StockPage = {
  rows: StockRow[]
  nextAfterId: number | null
}

export type { StockPage }
