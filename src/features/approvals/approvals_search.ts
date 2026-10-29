import * as v from "valibot"

const approvalsSearch = v.object({
  status: v.fallback(v.optional(v.picklist(["pending", "verified", "approved", "rejected"])), undefined),
  after: v.fallback(v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))), undefined),
  selected: v.fallback(v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))), undefined)
})

export { approvalsSearch }
