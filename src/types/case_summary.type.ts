import type { CaseCategoryTally } from "./case_category_tally.type"
import type { MerchantStanding } from "./merchant_standing.type"

type CaseSummary = {
  merchantPrincipalId: string
  merchantTag: string
  merchant: {
    storeName: string | null
    status: MerchantStanding | null
  }
  confirmedCount: number
  pendingCount: number
  totalCount: number
  windowCount: number
  earliestWindow: number
  latestWindow: number
  firstReportedAt: string
  latestReportedAt: string
  categories: CaseCategoryTally[]
}

export type { CaseSummary }
