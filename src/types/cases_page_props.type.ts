import type { CasesSearch } from "./cases_search.type"

type CasesPageProps = {
  search: CasesSearch
  onSearch: (next: CasesSearch) => void
}

export type { CasesPageProps }
