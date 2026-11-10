import * as v from "valibot"

function number() {
  return v.fallback(
    v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(Number.MAX_SAFE_INTEGER))),
    undefined
  )
}

const dispatchSearch = v.object({
  status: v.fallback(v.optional(v.picklist(["pending", "assigned", "picked_up", "delivered", "cancelled"])), undefined),
  before: number(),
  job: number()
})

const fleetSearch = v.object({
  status: v.fallback(v.optional(v.picklist(["online", "busy", "offline"])), undefined),
  courier: number()
})

export { dispatchSearch, fleetSearch }
