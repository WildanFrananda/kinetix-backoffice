import en from "../../catalogue/orders/en.json"
import id from "../../catalogue/orders/id.json"
import { featureCatalogues } from "../../i18n/feature_catalogues"
import { useLocale } from "../../i18n/use_locale"
import type { OrdersCatalogue } from "../../types/orders_catalogue.type"

const ordersCatalogues = featureCatalogues(en, id satisfies typeof en)

function useOrdersText(): OrdersCatalogue {
  return ordersCatalogues[useLocale()]
}

export { useOrdersText }
