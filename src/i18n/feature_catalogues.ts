import type { Catalogue } from "../types/catalogue.type"
import type { Locale } from "../types/locale.type"
import { catalogues } from "./catalogues"

function featureCatalogues<Feature extends object>(
  en: Feature,
  id: Feature
): Readonly<Record<Locale, Catalogue & Feature>> {
  return {
    en: { ...catalogues.en, ...en },
    id: { ...catalogues.id, ...id }
  }
}

export { featureCatalogues }
