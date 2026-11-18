import type { CaseReport } from "./case_report.type"
import type { CaseSummary } from "./case_summary.type"

type CaseDetail = CaseSummary & {
  reports: CaseReport[]
}

export type { CaseDetail }
