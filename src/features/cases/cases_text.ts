import en from "../../catalogue/cases/en.json"
import id from "../../catalogue/cases/id.json"
import { featureCatalogues } from "../../i18n/feature_catalogues"
import { useLocale } from "../../i18n/use_locale"
import type { CasesCatalogue } from "../../types/cases_catalogue.type"

const casesCatalogues = featureCatalogues(en, id satisfies typeof en)

function useCasesText(): CasesCatalogue {
  return casesCatalogues[useLocale()]
}

export { useCasesText }
