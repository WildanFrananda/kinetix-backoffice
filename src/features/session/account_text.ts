import en from "../../catalogue/account/en.json"
import id from "../../catalogue/account/id.json"
import { featureCatalogues } from "../../i18n/feature_catalogues"
import { useLocale } from "../../i18n/use_locale"
import type { AccountCatalogue } from "../../types/account_catalogue.type"

const accountCatalogues = featureCatalogues(en, id satisfies typeof en)

function useAccountText(): AccountCatalogue {
  return accountCatalogues[useLocale()]
}

export { useAccountText }
