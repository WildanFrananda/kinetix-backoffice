import type { CaseSummary } from "../../types/case_summary.type"
import type { CasesCatalogue } from "../../types/cases_catalogue.type"
import type { MerchantStanding } from "../../types/merchant_standing.type"

function shortPrincipal(principalId: string): string {
  return principalId.slice(0, 8)
}

function windowLabel(window: number): string {
  const year = Math.floor(window / 100)
  const month = window % 100

  if (year <= 0 || month < 1 || month > 12) {
    return String(window)
  }

  return `${year}-${String(month).padStart(2, "0")}`
}

function timestampLabel(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(iso))
}

function standingTone(standing: MerchantStanding | null): "neutral" | "attention" | "settled" {
  if (standing === "verified") {
    return "settled"
  }

  if (standing === "pending" || standing === "suspended") {
    return "attention"
  }

  return "neutral"
}

function standingLabel(standing: MerchantStanding | null, text: CasesCatalogue): string {
  if (standing === null) {
    return text["cases.detail.standing.unknown"]
  }

  return text[`cases.detail.standing.${standing}`]
}

function merchantHeading(summary: CaseSummary, text: CasesCatalogue, kind: "item" | "detail"): string {
  if (summary.merchant.storeName !== null && summary.merchant.storeName !== "") {
    return summary.merchant.storeName
  }

  const principal = shortPrincipal(summary.merchantPrincipalId)

  return kind === "item"
    ? text["cases.item.unnamed"].replace("{principal}", principal)
    : text["cases.detail.unnamed"].replace("{principal}", principal)
}

export { merchantHeading, shortPrincipal, standingLabel, standingTone, timestampLabel, windowLabel }
