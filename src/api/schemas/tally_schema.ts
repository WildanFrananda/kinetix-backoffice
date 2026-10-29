import * as v from "valibot"
import type { DecisionTally } from "../../types/decision_tally.type"
import { countSchema } from "./count_schema"
import { instantSchema } from "./instant_schema"

const tallySchema = v.pipe(
  v.object({ since: instantSchema, approved: countSchema, rejected: countSchema }),
  v.transform((tally): DecisionTally => ({ approved: tally.approved, rejected: tally.rejected }))
)

export { tallySchema }
