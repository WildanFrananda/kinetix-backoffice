import type predicates from "../catalogue/predicates/en.json"
import type { Catalogue } from "./catalogue.type"

type PredicatesCatalogue = Catalogue & typeof predicates

export type { PredicatesCatalogue }
