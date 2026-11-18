import * as v from "valibot"

const casesSearch = v.object({
  selected: v.fallback(v.optional(v.pipe(v.string(), v.uuid())), undefined),
  status: v.fallback(v.optional(v.picklist(["all", "confirmed", "submitted"])), undefined)
})

export { casesSearch }
