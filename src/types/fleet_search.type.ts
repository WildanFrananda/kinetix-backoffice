import type { CourierStatus } from "./courier_status.type"

type FleetSearch = {
  status?: CourierStatus | undefined
  courier?: number | undefined
}

export type { FleetSearch }
