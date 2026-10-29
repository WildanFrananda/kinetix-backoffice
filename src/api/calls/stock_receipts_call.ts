import type { BffCall } from "../../types/bff_call.type"
import type { LedgerPage } from "../../types/ledger_page.type"
import type { StockFilter } from "../../types/stock_filter.type"
import { receiptPageSchema } from "../schemas/stock_schemas"
import { stockQuery } from "./stock_query"

function stockReceiptsCall(filter: StockFilter, before: number | undefined): BffCall<LedgerPage> {
  return {
    endpoint: "warehouse.listReceipts",
    method: "GET",
    path: "/bff/api/v1/warehouse/stock_receipts",
    query: stockQuery(filter, before === undefined ? {} : { before: String(before) }),
    schema: receiptPageSchema
  }
}

export { stockReceiptsCall }
