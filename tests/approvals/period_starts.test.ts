import { describe, expect, it } from "vitest"
import { periodStarts } from "../../src/features/approvals/period_starts"

describe("period starts", () => {
  it("starts the day at local midnight, the week on Monday and the month on its first day", () => {
    const starts = periodStarts(new Date(2026, 9, 29, 15, 42, 7))

    expect(starts.day).toEqual(new Date(2026, 9, 29))
    expect(starts.week).toEqual(new Date(2026, 9, 26))
    expect(starts.month).toEqual(new Date(2026, 9, 1))
  })

  it("keeps a Sunday in the week that began the Monday before", () => {
    expect(periodStarts(new Date(2026, 10, 1, 9)).week).toEqual(new Date(2026, 9, 26))
  })

  it("keeps a Monday as the first day of its own week", () => {
    expect(periodStarts(new Date(2026, 10, 2, 0, 0, 1)).week).toEqual(new Date(2026, 10, 2))
  })

  it("reaches back into the previous month and year when the week began there", () => {
    const starts = periodStarts(new Date(2027, 0, 1, 12))

    expect(starts.week).toEqual(new Date(2026, 11, 28))
    expect(starts.month).toEqual(new Date(2027, 0, 1))
  })
})
