import * as v from "valibot"
import type { Category } from "../../types/category.type"

const categorySchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  name: v.string(),
  slug: v.string()
}) satisfies v.GenericSchema<unknown, Category>

export { categorySchema }
