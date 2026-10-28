import * as v from "valibot"

const countSchema = v.pipe(v.number(), v.integer(), v.minValue(0))

export { countSchema }
