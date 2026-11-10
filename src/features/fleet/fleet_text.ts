import en from "../../catalogue/fleet/en.json"
import id from "../../catalogue/fleet/id.json"
import { featureCatalogues } from "../../i18n/feature_catalogues"
import { useLocale } from "../../i18n/use_locale"
import type { FleetCatalogue } from "../../types/fleet_catalogue.type"

const fleetCatalogues = featureCatalogues(en, id satisfies typeof en)

function useFleetText(): FleetCatalogue {
  return fleetCatalogues[useLocale()]
}

export { useFleetText }
