import en from "../../catalogue/map/en.json"
import id from "../../catalogue/map/id.json"
import { featureCatalogues } from "../../i18n/feature_catalogues"
import { useLocale } from "../../i18n/use_locale"
import type { MapCatalogue } from "../../types/map_catalogue.type"

const mapCatalogues = featureCatalogues(en, id satisfies typeof en)

function useMapText(): MapCatalogue {
  return mapCatalogues[useLocale()]
}

export { useMapText }
