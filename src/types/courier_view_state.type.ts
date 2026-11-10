import type { BffFailure } from "./bff_failure.type"
import type { FleetCourier } from "./fleet_courier.type"

type CourierViewState =
  | { kind: "loading" }
  | { kind: "failed"; failure: BffFailure | null; retry: () => void }
  | { kind: "known"; courier: FleetCourier | null }

export type { CourierViewState }
