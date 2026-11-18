import * as v from "valibot"
import type { CaseDetail } from "../../types/case_detail.type"
import type { CaseListing } from "../../types/case_listing.type"
import type { CaseSummary } from "../../types/case_summary.type"

const categoryTallySchema = v.object({
  slug: v.string(),
  label: v.string(),
  count: v.pipe(v.number(), v.integer(), v.minValue(1))
})

const merchantStandingSchema = v.picklist(["pending", "verified", "suspended", "closed"])

const caseSummarySchema = v.object({
  merchantPrincipalId: v.pipe(v.string(), v.uuid()),
  merchantTag: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
  merchant: v.object({
    storeName: v.nullable(v.string()),
    status: v.nullable(merchantStandingSchema)
  }),
  confirmedCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  pendingCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  totalCount: v.pipe(v.number(), v.integer(), v.minValue(1)),
  windowCount: v.pipe(v.number(), v.integer(), v.minValue(1)),
  earliestWindow: v.pipe(v.number(), v.integer(), v.minValue(0)),
  latestWindow: v.pipe(v.number(), v.integer(), v.minValue(0)),
  firstReportedAt: v.pipe(v.string(), v.isoTimestamp()),
  latestReportedAt: v.pipe(v.string(), v.isoTimestamp()),
  categories: v.array(categoryTallySchema)
}) satisfies v.GenericSchema<unknown, CaseSummary>

const caseReportSchema = v.object({
  nullifier: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
  category: v.object({
    slug: v.string(),
    label: v.string()
  }),
  body: v.string(),
  window: v.pipe(v.number(), v.integer(), v.minValue(0)),
  status: v.picklist(["submitted", "confirmed"]),
  firstGeneration: v.pipe(v.number(), v.integer(), v.minValue(1)),
  txId: v.nullable(v.string()),
  submittedAt: v.pipe(v.string(), v.isoTimestamp()),
  confirmedAt: v.nullable(v.pipe(v.string(), v.isoTimestamp()))
})

const caseListingSchema = v.object({
  cases: v.array(caseSummarySchema)
}) satisfies v.GenericSchema<unknown, CaseListing>

const caseDetailSchema = v.object({
  ...caseSummarySchema.entries,
  reports: v.array(caseReportSchema)
}) satisfies v.GenericSchema<unknown, CaseDetail>

export { caseDetailSchema, caseListingSchema, caseSummarySchema }
