import { queryOptions } from "@tanstack/react-query"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { bffRequest } from "../../api/bff_request"
import { binStockCall } from "../../api/calls/bin_stock_call"
import { productCall } from "../../api/calls/product_call"
import { stockAdjustmentsCall } from "../../api/calls/stock_adjustments_call"
import { stockReceiptsCall } from "../../api/calls/stock_receipts_call"
import { warehouseBinsCall } from "../../api/calls/warehouse_bins_call"
import type { CatalogProduct } from "../../types/catalog_product.type"
import type { StockFilter } from "../../types/stock_filter.type"

const stockKey = ["bff", "stock"] as const

function every(poll: boolean): number | false {
  return poll ? 60_000 : false
}

function binsQuery(after: string | undefined, poll: boolean) {
  return queryOptions({
    queryKey: [...stockKey, "bins", after ?? ""],
    queryFn: ({ signal }) => bffFetch(warehouseBinsCall(after), signal),
    refetchInterval: every(poll)
  })
}

function shelfQuery(filter: StockFilter, after: number | undefined, poll: boolean) {
  return queryOptions({
    queryKey: [...stockKey, "shelf", filter.binCode ?? "", filter.sku ?? "", after ?? 0],
    queryFn: ({ signal }) => bffFetch(binStockCall(filter, after), signal),
    refetchInterval: every(poll)
  })
}

function ledgerQuery(kind: "receipts" | "adjustments", filter: StockFilter, before: number | undefined) {
  const call = kind === "receipts" ? stockReceiptsCall : stockAdjustmentsCall

  return queryOptions({
    queryKey: [...stockKey, kind, filter.binCode ?? "", filter.sku ?? "", before ?? 0],
    queryFn: ({ signal }) => bffFetch(call(filter, before), signal)
  })
}

async function readProduct(sku: string, signal: AbortSignal): Promise<CatalogProduct | null> {
  const result = await bffRequest(productCall(sku), { signal })
  if (result.ok) {
    return result.value
  }

  if (result.failure.kind === "refused" && result.failure.status === 404) {
    return null
  }

  throw new BffError(result.failure)
}

function productQuery(sku: string) {
  return queryOptions({
    queryKey: ["bff", "catalog-product", sku],
    queryFn: ({ signal }) => readProduct(sku, signal),
    staleTime: 60_000,
    enabled: sku.length > 0
  })
}

export { binsQuery, ledgerQuery, productQuery, shelfQuery, stockKey }
