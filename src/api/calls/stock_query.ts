import type { StockFilter } from "../../types/stock_filter.type"

const ledgerPageSize = 20

function stockQuery(filter: StockFilter, cursor: Readonly<Record<string, string>>): Record<string, string> {
  const query: Record<string, string> = { limit: String(ledgerPageSize), ...cursor }

  if (filter.sku !== undefined) {
    query.sku = filter.sku
  }

  if (filter.binCode !== undefined) {
    query.bin_code = filter.binCode
  }

  return query
}

export { ledgerPageSize, stockQuery }
