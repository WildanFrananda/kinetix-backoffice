import en from "../catalogue/en.json"
import id from "../catalogue/id.json"
import type { Catalogue } from "../types/catalogue.type"
import type { Locale } from "../types/locale.type"

const catalogues: Readonly<Record<Locale, Catalogue>> = {
  en,
  id: id satisfies Catalogue
}

export { catalogues }
