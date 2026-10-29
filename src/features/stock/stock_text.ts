import en from "../../catalogue/stock/en.json"
import id from "../../catalogue/stock/id.json"
import { featureCatalogues } from "../../i18n/feature_catalogues"
import { useLocale } from "../../i18n/use_locale"
import type { StockCatalogue } from "../../types/stock_catalogue.type"

const stockCatalogues = featureCatalogues(en, id satisfies typeof en)

function useStockText(): StockCatalogue {
  return stockCatalogues[useLocale()]
}

export { useStockText }
