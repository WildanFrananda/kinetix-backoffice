import type { BffCall } from "../../types/bff_call.type"
import type { BinDraft } from "../../types/bin_draft.type"
import type { SavedBin } from "../../types/saved_bin.type"
import { savedBinSchema } from "../schemas/stock_schemas"

function upsertBinCall(draft: BinDraft): BffCall<SavedBin> {
  return {
    endpoint: "warehouse.upsertBin",
    method: "POST",
    path: "/bff/api/v1/warehouse/bins",
    body: { bin_code: draft.code, zone: draft.zone, shelf_level: draft.shelfLevel },
    schema: savedBinSchema
  }
}

export { upsertBinCall }
