import type orders from "../catalogue/orders/en.json"
import type { Catalogue } from "./catalogue.type"

type OrdersCatalogue = Catalogue & typeof orders

export type { OrdersCatalogue }
