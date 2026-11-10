import type { BffCall } from "../../types/bff_call.type"
import type { FleetCourier } from "../../types/fleet_courier.type"
import { courierListSchema } from "../schemas/dispatch_schemas"

const fleetCouriersCall: BffCall<FleetCourier[]> = {
  endpoint: "matching.listDrivers",
  method: "GET",
  path: "/bff/api/v1/matching/drivers",
  schema: courierListSchema
}

export { fleetCouriersCall }
