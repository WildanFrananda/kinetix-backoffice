import * as v from "valibot"

const predicatesSearch = v.object({
  selected: v.fallback(v.optional(v.pipe(v.string(), v.uuid())), undefined),
  creating: v.fallback(v.optional(v.literal(true)), undefined)
})

export { predicatesSearch }
