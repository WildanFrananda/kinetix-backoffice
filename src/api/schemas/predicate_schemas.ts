import * as v from "valibot"
import type { Predicate } from "../../types/predicate.type"
import type { PredicateListing } from "../../types/predicate_listing.type"

const predicateRowSchema = v.object({
  id: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
  minimums: v.array(v.pipe(v.string(), v.regex(/^[0-9]+$/))),
  minimumIssueDay: v.pipe(v.number(), v.integer(), v.minValue(0)),
  minimumIssueDate: v.pipe(v.string(), v.isoDate()),
  current: v.boolean(),
  placed: v.boolean()
})

const predicateSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  status: v.picklist(["live", "withdrawn"]),
  class: v.string(),
  classId: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
  label: v.string(),
  minimums: v.object({
    deliveries: v.pipe(v.number(), v.integer(), v.minValue(0)),
    ratingHundredths: v.pipe(v.number(), v.integer(), v.minValue(0)),
    daysActive: v.pipe(v.number(), v.integer(), v.minValue(0))
  }),
  freshnessDays: v.pipe(v.number(), v.integer(), v.minValue(1)),
  approvedAt: v.pipe(v.string(), v.isoTimestamp()),
  withdrawnAt: v.nullable(v.pipe(v.string(), v.isoTimestamp())),
  rows: v.array(predicateRowSchema)
}) satisfies v.GenericSchema<unknown, Predicate>

const predicateListingSchema = v.object({
  registry: v.nullable(
    v.object({
      generation: v.pipe(v.number(), v.integer(), v.minValue(1)),
      contractAddress: v.string()
    })
  ),
  predicates: v.array(predicateSchema)
}) satisfies v.GenericSchema<unknown, PredicateListing>

export { predicateListingSchema, predicateSchema }
