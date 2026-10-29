import type categories from "../catalogue/categories/en.json"
import type { Catalogue } from "./catalogue.type"

type CategoriesCatalogue = Catalogue & typeof categories

export type { CategoriesCatalogue }
