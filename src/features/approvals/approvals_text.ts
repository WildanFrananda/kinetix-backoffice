import en from "../../catalogue/approvals/en.json"
import id from "../../catalogue/approvals/id.json"
import { featureCatalogues } from "../../i18n/feature_catalogues"
import { useLocale } from "../../i18n/use_locale"
import type { ApprovalsCatalogue } from "../../types/approvals_catalogue.type"

const approvalsCatalogues = featureCatalogues(en, id satisfies typeof en)

function useApprovalsText(): ApprovalsCatalogue {
  return approvalsCatalogues[useLocale()]
}

export { useApprovalsText }
