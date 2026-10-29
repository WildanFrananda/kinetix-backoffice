import type { BffCall } from "../../types/bff_call.type"
import type { Category } from "../../types/category.type"
import type { CategoryDraft } from "../../types/category_draft.type"
import { categorySchema } from "../schemas/category_schema"

function createCategoryCall(draft: CategoryDraft): BffCall<Category> {
  return {
    endpoint: "catalog.createCategory",
    method: "POST",
    path: "/bff/api/v1/categories",
    body: { name: draft.name, slug: draft.slug },
    schema: categorySchema
  }
}

export { createCategoryCall }
