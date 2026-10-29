import { describe, expect, it } from "vitest"
import { afterDecision, searchWith, selectedIn, stepFrom } from "../../src/features/approvals/queue_selection"

describe("moving through a queue", () => {
  it("selects what the address names, else the oldest application", () => {
    expect(selectedIn([4, 5, 6], 5)).toBe(5)
    expect(selectedIn([4, 5, 6], 9)).toBe(4)
    expect(selectedIn([], 9)).toBeNull()
  })

  it("steps within the list and stops at its ends", () => {
    expect(stepFrom([4, 5, 6], 5, 1)).toBe(6)
    expect(stepFrom([4, 5, 6], 6, 1)).toBe(6)
    expect(stepFrom([4, 5, 6], 4, -1)).toBe(4)
    expect(stepFrom([4, 5, 6], null, 1)).toBe(4)
  })

  it("moves on to the next application after a decision, or back when it was the last", () => {
    expect(afterDecision([4, 5, 6], 5)).toBe(6)
    expect(afterDecision([4, 5, 6], 6)).toBe(5)
    expect(afterDecision([4], 4)).toBeNull()
  })

  it("keeps the address short: no zero cursor, and a cleared field leaves", () => {
    expect(searchWith({ status: "rejected", after: 40, selected: 3 }, { after: 0, selected: undefined })).toEqual({
      status: "rejected"
    })
  })
})
