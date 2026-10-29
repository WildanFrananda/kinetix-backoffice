import type { BffCall } from "../../types/bff_call.type"
import type { CatalogProduct } from "../../types/catalog_product.type"
import { productSchema } from "../schemas/stock_schemas"

function productCall(sku: string): BffCall<CatalogProduct> {
  return {
    endpoint: "catalog.getProduct",
    method: "GET",
    path: `/bff/api/v1/products/${encodeURIComponent(sku)}`,
    schema: productSchema
  }
}

export { productCall }
