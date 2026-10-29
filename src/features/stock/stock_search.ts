import * as v from "valibot"

function text(max: number) {
  return v.fallback(v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(max))), undefined)
}

const stockSearch = v.object({
  bin: text(64),
  after: text(64),
  sku: text(128)
})

export { stockSearch }
