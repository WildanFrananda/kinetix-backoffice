import * as v from "valibot"

const nameLimit = 128

const nameSchema = v.pipe(
  v.string(),
  v.check((value) => !value.includes("\u0000"), "categories.rule.nameNul"),
  v.check((value) => value.trim().length > 0, "categories.rule.nameRequired"),
  v.check((value) => [...value.trim()].length <= nameLimit, "categories.rule.nameLong")
)

const slugSchema = v.pipe(v.string(), v.regex(/^[-A-Za-z0-9_]{1,128}$/, "categories.rule.slugShape"))

export { nameSchema, slugSchema }
