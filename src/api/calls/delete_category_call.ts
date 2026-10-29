import * as v from "valibot"
import type { BffCall } from "../../types/bff_call.type"

function deleteCategoryCall(id: number): BffCall<undefined> {
  return {
    endpoint: "catalog.deleteCategory",
    method: "DELETE",
    path: `/bff/api/v1/categories/${id}`,
    schema: v.undefined()
  }
}

export { deleteCategoryCall }
