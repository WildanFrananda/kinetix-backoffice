import * as v from "valibot"

const unprintable = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u

function codePoints(text: string): number {
  return [...text].length
}

function wholeBetween(label: string, max: number) {
  return v.pipe(
    v.string(),
    v.trim(),
    v.regex(/^[0-9]+$/, label),
    v.check((value) => Number(value) <= max, label)
  )
}

const labelSchema = v.pipe(
  v.string(),
  v.check((value) => value.trim().length > 0, "predicates.rule.labelRequired"),
  v.check((value) => codePoints(value.trim()) <= 80, "predicates.rule.labelLong"),
  v.check((value) => !unprintable.test(value.trim()), "predicates.rule.labelUnprintable")
)

const deliveriesSchema = wholeBetween("predicates.rule.deliveries", 1_000_000)
const daysActiveSchema = wholeBetween("predicates.rule.daysActive", 36_525)
const freshnessSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^[0-9]+$/, "predicates.rule.freshness"),
  v.check((value) => Number(value) >= 1 && Number(value) <= 365, "predicates.rule.freshness")
)

const ratingSchema = v.pipe(
  v.string(),
  v.trim(),
  v.regex(/^[0-5]([.,][0-9]{1,2})?$/, "predicates.rule.rating"),
  v.check((value) => ratingHundredthsOf(value) <= 500, "predicates.rule.rating")
)

function ratingHundredthsOf(text: string): number {
  const [whole = "0", fraction = ""] = text.trim().replace(",", ".").split(".")

  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"))
}

export { daysActiveSchema, deliveriesSchema, freshnessSchema, labelSchema, ratingHundredthsOf, ratingSchema }
