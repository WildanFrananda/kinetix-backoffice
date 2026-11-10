import type fleet from "../catalogue/fleet/en.json"
import type { Catalogue } from "./catalogue.type"

type FleetCatalogue = Catalogue & typeof fleet

export type { FleetCatalogue }
