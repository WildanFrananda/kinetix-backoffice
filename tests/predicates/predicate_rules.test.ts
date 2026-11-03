import * as v from "valibot"
import { describe, expect, it } from "vitest"
import {
  daysActiveSchema,
  deliveriesSchema,
  freshnessSchema,
  labelSchema,
  ratingHundredthsOf,
  ratingSchema
} from "../../src/features/predicates/predicate_rules"

function accepts(schema: v.GenericSchema<unknown, string>, value: string): boolean {
  return v.safeParse(schema, value).success
}

describe("the predicate rules seal documents", () => {
  it("reads a rating as hundredths, with a dot or a comma", () => {
    expect(ratingHundredthsOf("4.5")).toBe(450)
    expect(ratingHundredthsOf("4,75")).toBe(475)
    expect(ratingHundredthsOf("5")).toBe(500)
    expect(ratingHundredthsOf(" 0.05 ")).toBe(5)
  })

  it("keeps each value within the bounds seal enforces", () => {
    expect(accepts(ratingSchema, "4.5")).toBe(true)
    expect(accepts(ratingSchema, "5.01")).toBe(false)
    expect(accepts(ratingSchema, "4.555")).toBe(false)
    expect(accepts(deliveriesSchema, "1000000")).toBe(true)
    expect(accepts(deliveriesSchema, "1000001")).toBe(false)
    expect(accepts(deliveriesSchema, "-1")).toBe(false)
    expect(accepts(daysActiveSchema, "36525")).toBe(true)
    expect(accepts(daysActiveSchema, "36526")).toBe(false)
    expect(accepts(freshnessSchema, "0")).toBe(false)
    expect(accepts(freshnessSchema, "365")).toBe(true)
    expect(accepts(freshnessSchema, "366")).toBe(false)
  })

  it("asks for a printable name of at most 80 characters", () => {
    expect(accepts(labelSchema, "Experienced courier")).toBe(true)
    expect(accepts(labelSchema, "   ")).toBe(false)
    expect(accepts(labelSchema, "é".repeat(80))).toBe(true)
    expect(accepts(labelSchema, "x".repeat(81))).toBe(false)
    expect(accepts(labelSchema, "line\nbreak")).toBe(false)
  })
})
