import type { ApprovalsSearch } from "../../types/approvals_search.type"

function selectedIn(ids: readonly number[], wanted: number | undefined): number | null {
  if (wanted !== undefined && ids.includes(wanted)) {
    return wanted
  }

  return ids[0] ?? null
}

function stepFrom(ids: readonly number[], current: number | null, step: 1 | -1): number | null {
  if (ids.length === 0) {
    return null
  }

  const index = current === null ? -1 : ids.indexOf(current)
  const next = Math.min(ids.length - 1, Math.max(0, index + step))

  return ids[next] ?? null
}

function afterDecision(ids: readonly number[], decided: number): number | null {
  const index = ids.indexOf(decided)
  const rest = ids.filter((id) => id !== decided)
  if (rest.length === 0) {
    return null
  }

  return rest[Math.min(Math.max(index, 0), rest.length - 1)] ?? null
}

function searchWith(
  current: ApprovalsSearch,
  patch: ApprovalsSearch & { selected?: number | undefined }
): ApprovalsSearch {
  const next: ApprovalsSearch = {}
  const merged = { ...current, ...patch }

  if (merged.status !== undefined) {
    next.status = merged.status
  }

  if (merged.after !== undefined && merged.after > 0) {
    next.after = merged.after
  }

  if (merged.selected !== undefined) {
    next.selected = merged.selected
  }

  return next
}

export { afterDecision, searchWith, selectedIn, stepFrom }
