import * as v from "valibot"

const emailSchema = v.pipe(v.string(), v.trim(), v.maxLength(254, "validation.email"), v.email("validation.email"))

const passwordSchema = v.pipe(
  v.string(),
  v.minLength(6, "validation.password"),
  v.maxLength(1024, "validation.password")
)

const codeSchema = v.pipe(
  v.string(),
  v.transform((value) => value.replace(/\s/g, "")),
  v.regex(/^\d{6}$/, "validation.code")
)

export { codeSchema, emailSchema, passwordSchema }
