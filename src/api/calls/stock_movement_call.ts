import type { BffCall } from "../../types/bff_call.type"
import type { StockMovement } from "../../types/stock_movement.type"
import type { StockMovementRequest } from "../../types/stock_movement_request.type"
import { movementSchema } from "../schemas/stock_schemas"

function stockMovementCall(request: StockMovementRequest): BffCall<StockMovement> {
  const owner = {
    bin_code: request.binCode,
    sku: request.sku,
    merchant_principal_id: request.merchantPrincipalId,
    idempotency_key: request.idempotencyKey
  }

  const note = request.note.trim().length > 0 ? { note: request.note.trim() } : {}

  if (request.kind === "receipt") {
    return {
      endpoint: "warehouse.receiveStock",
      method: "POST",
      path: "/bff/api/v1/warehouse/stock_receipts",
      body: { ...owner, quantity: request.quantity, ...note },
      schema: movementSchema
    }
  }

  return {
    endpoint: "warehouse.adjustStock",
    method: "POST",
    path: "/bff/api/v1/warehouse/stock_adjustments",
    body: { ...owner, quantity_delta: request.delta, reason: request.reason, ...note },
    schema: movementSchema
  }
}

export { stockMovementCall }
