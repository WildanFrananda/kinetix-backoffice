import en from "../../catalogue/categories/en.json"
import id from "../../catalogue/categories/id.json"
import { featureCatalogues } from "../../i18n/feature_catalogues"
import { useLocale } from "../../i18n/use_locale"
import type { CategoriesCatalogue } from "../../types/categories_catalogue.type"

const categoriesCatalogues = featureCatalogues(en, id satisfies typeof en)

function useCategoriesText(): CategoriesCatalogue {
  return categoriesCatalogues[useLocale()]
}

export { useCategoriesText }
