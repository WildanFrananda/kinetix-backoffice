import type { BffCall } from "../../types/bff_call.type"
import type { Category } from "../../types/category.type"
import type { CategoryDraft } from "../../types/category_draft.type"
import { categorySchema } from "../schemas/category_schema"

function updateCategoryCall(id: number, draft: CategoryDraft): BffCall<Category> {
  return {
    endpoint: "catalog.updateCategory",
    method: "PUT",
    path: `/bff/api/v1/categories/${id}`,
    body: { name: draft.name, slug: draft.slug },
    schema: categorySchema
  }
}

export { updateCategoryCall }
