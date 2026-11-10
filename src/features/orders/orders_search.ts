import * as v from "valibot"
import { orderStatuses } from "../../api/schemas/order_statuses"
import { isDay } from "./local_day"

const known: ReadonlySet<string> = new Set(orderStatuses)

function text(max: number) {
  return v.fallback(v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(max))), undefined)
}

function day() {
  return v.fallback(v.optional(v.pipe(v.string(), v.check(isDay))), undefined)
}

const statusList = v.fallback(
  v.optional(
    v.pipe(
      v.string(),
      v.check((value) => value.split(",").every((name) => known.has(name)))
    )
  ),
  undefined
)

const ordersSearch = v.object({
  status: statusList,
  from: day(),
  to: day(),
  merchant: text(128),
  customer: text(128),
  orderNumber: text(64),
  before: text(512),
  order: v.fallback(v.optional(v.pipe(v.string(), v.uuid())), undefined)
})

const sagasSearch = v.object({
  selected: v.fallback(v.optional(v.pipe(v.string(), v.uuid())), undefined)
})

const returnsSearch = v.object({
  selected: text(64)
})

export { ordersSearch, returnsSearch, sagasSearch }
