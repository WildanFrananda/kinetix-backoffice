import type { CaseSummary } from "./case_summary.type"

type CaseListProps = {
  cases: readonly CaseSummary[]
  selected: string | null
  onSelect: (merchantId: string) => void
}

export type { CaseListProps }
