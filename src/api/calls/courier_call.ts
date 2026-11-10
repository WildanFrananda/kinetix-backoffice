import type { BffCall } from "../../types/bff_call.type"
import type { FleetCourier } from "../../types/fleet_courier.type"
import { courierAnswerSchema } from "../schemas/dispatch_schemas"

function courierCall(id: number): BffCall<FleetCourier> {
  return {
    endpoint: "matching.getDriver",
    method: "GET",
    path: `/bff/api/v1/matching/drivers/${id}`,
    schema: courierAnswerSchema
  }
}

export { courierCall }
