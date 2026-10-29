import type { BffCall } from "../../types/bff_call.type"
import type { StockFilter } from "../../types/stock_filter.type"
import type { StockPage } from "../../types/stock_page.type"
import { stockPageSchema } from "../schemas/stock_schemas"
import { stockQuery } from "./stock_query"

function binStockCall(filter: StockFilter, after: number | undefined): BffCall<StockPage> {
  return {
    endpoint: "warehouse.listStock",
    method: "GET",
    path: "/bff/api/v1/warehouse/bins/stock",
    query: stockQuery(filter, after === undefined ? {} : { after: String(after) }),
    schema: stockPageSchema
  }
}

export { binStockCall }
