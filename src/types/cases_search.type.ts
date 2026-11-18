import type { CaseStatusFilter } from "./case_status_filter.type"

type CasesSearch = {
  selected?: string | undefined
  status?: CaseStatusFilter | undefined
}

export type { CasesSearch }
