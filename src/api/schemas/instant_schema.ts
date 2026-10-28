import * as v from "valibot"

const instantSchema = v.pipe(
  v.string(),
  v.isoTimestamp(),
  v.transform((value) => new Date(value))
)

export { instantSchema }
