import type cases from "../catalogue/cases/en.json"
import type { Catalogue } from "./catalogue.type"

type CasesCatalogue = Catalogue & typeof cases

export type { CasesCatalogue }
