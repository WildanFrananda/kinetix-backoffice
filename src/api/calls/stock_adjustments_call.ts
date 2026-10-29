import type { BffCall } from "../../types/bff_call.type"
import type { LedgerPage } from "../../types/ledger_page.type"
import type { StockFilter } from "../../types/stock_filter.type"
import { adjustmentPageSchema } from "../schemas/stock_schemas"
import { stockQuery } from "./stock_query"

function stockAdjustmentsCall(filter: StockFilter, before: number | undefined): BffCall<LedgerPage> {
  return {
    endpoint: "warehouse.listAdjustments",
    method: "GET",
    path: "/bff/api/v1/warehouse/stock_adjustments",
    query: stockQuery(filter, before === undefined ? {} : { before: String(before) }),
    schema: adjustmentPageSchema
  }
}

export { stockAdjustmentsCall }
