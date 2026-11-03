import en from "../../catalogue/predicates/en.json"
import id from "../../catalogue/predicates/id.json"
import { featureCatalogues } from "../../i18n/feature_catalogues"
import { useLocale } from "../../i18n/use_locale"
import type { PredicatesCatalogue } from "../../types/predicates_catalogue.type"

const predicatesCatalogues = featureCatalogues(en, id satisfies typeof en)

function usePredicatesText(): PredicatesCatalogue {
  return predicatesCatalogues[useLocale()]
}

export { usePredicatesText }
