import * as v from "valibot"

const categoriesSearch = v.object({
  selected: v.fallback(v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))), undefined),
  creating: v.fallback(v.optional(v.literal(true)), undefined)
})

export { categoriesSearch }
