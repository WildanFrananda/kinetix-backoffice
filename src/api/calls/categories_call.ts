import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"
import type { Category } from "../../types/category.type"
import { categorySchema } from "../schemas/category_schema"

const categoriesCall: BffCall<Category[]> = {
  endpoint: "catalog.listCategories",
  method: "GET",
  path: "/bff/api/v1/categories",
  schema: v.array(categorySchema)
}

export { categoriesCall }
