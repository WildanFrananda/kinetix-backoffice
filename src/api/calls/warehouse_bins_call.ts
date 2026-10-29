import type { BffCall } from "../../types/bff_call.type"
import type { BinPage } from "../../types/bin_page.type"
import { binPageSchema } from "../schemas/stock_schemas"

const binsPageSize = 50

function warehouseBinsCall(after: string | undefined): BffCall<BinPage> {
  const query: Record<string, string> = { limit: String(binsPageSize) }

  if (after !== undefined) {
    query.after = after
  }

  return {
    endpoint: "warehouse.listBins",
    method: "GET",
    path: "/bff/api/v1/warehouse/bins",
    query,
    schema: binPageSchema
  }
}

export { binsPageSize, warehouseBinsCall }
