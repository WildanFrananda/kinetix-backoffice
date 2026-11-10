import * as v from "valibot"
import { describe, expect, it } from "vitest"
import { isDay, localInstant, offsetText, startOfDay } from "../../src/features/orders/local_day"
import { orderQueryOf } from "../../src/features/orders/order_query_of"
import { ordersSearch } from "../../src/features/orders/orders_search"

describe("the admin's days as instants", () => {
  it("writes an offset east or west of UTC with its sign and minutes", () => {
    expect(offsetText(420)).toBe("+07:00")
    expect(offsetText(0)).toBe("+00:00")
    expect(offsetText(-150)).toBe("-02:30")
    expect(offsetText(345)).toBe("+05:45")
  })

  it("starts a day at its local midnight, with the offset that holds then", () => {
    const midnight = new Date(2026, 10, 10)
    const sent = startOfDay("2026-11-10", 0)

    expect(sent).toBe(`2026-11-10T00:00:00${offsetText(-midnight.getTimezoneOffset())}`)
    expect(new Date(sent ?? "").getTime()).toBe(midnight.getTime())
  })

  it("ends a range at the next day's midnight, across months and years", () => {
    expect(startOfDay("2026-11-30", 1)?.slice(0, 19)).toBe("2026-12-01T00:00:00")
    expect(startOfDay("2026-12-31", 1)?.slice(0, 19)).toBe("2027-01-01T00:00:00")
    expect(startOfDay("2028-02-28", 1)?.slice(0, 19)).toBe("2028-02-29T00:00:00")
  })

  it("writes any moment in local time with its offset", () => {
    const moment = new Date(2026, 0, 5, 9, 4, 3)

    expect(localInstant(moment).slice(0, 19)).toBe("2026-01-05T09:04:03")
    expect(new Date(localInstant(moment)).getTime()).toBe(moment.getTime())
  })

  it("knows a calendar day from a string that only looks like one", () => {
    expect(isDay("2026-11-10")).toBe(true)
    expect(isDay("2026-02-29")).toBe(false)
    expect(isDay("2028-02-29")).toBe(true)
    expect(isDay("2026-13-01")).toBe(false)
    expect(isDay("2026-1-01")).toBe(false)
    expect(startOfDay("2026-02-30", 0)).toBeUndefined()
  })
})

describe("the orders page's address", () => {
  it("keeps known statuses, real days and a uuid, and drops anything else", () => {
    expect(
      v.parse(ordersSearch, {
        status: "PAID,DELIVERED",
        from: "2026-11-01",
        to: "2026-11-31",
        merchant: "",
        orderNumber: "ORD-20261022-7F3A9C1B",
        before: "eyJhdCI6MX0",
        order: "not-a-uuid"
      })
    ).toEqual({
      status: "PAID,DELIVERED",
      from: "2026-11-01",
      to: undefined,
      merchant: undefined,
      customer: undefined,
      orderNumber: "ORD-20261022-7F3A9C1B",
      before: "eyJhdCI6MX0",
      order: undefined
    })

    expect(v.parse(ordersSearch, { status: "PAID,SENT" }).status).toBeUndefined()
  })

  it("turns the address into order's query: statuses in order's own order, the last day included", () => {
    const query = orderQueryOf({ status: "DELIVERED,PAID", from: "2026-11-01", to: "2026-11-10" })

    expect(query.statuses).toEqual(["PAID", "DELIVERED"])
    expect(query.createdFrom).toBe(startOfDay("2026-11-01", 0))
    expect(query.createdTo).toBe(startOfDay("2026-11-11", 0))
    expect(query.before).toBeUndefined()
  })
})
