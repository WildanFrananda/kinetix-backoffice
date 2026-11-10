import type { BffCall } from "../../types/bff_call.type"
import type { OrderPage } from "../../types/order_page.type"
import type { OrderQuery } from "../../types/order_query.type"
import { orderPageSchema } from "../schemas/order_schemas"

const ordersPageSize = 50

function searchOrdersCall(filter: OrderQuery): BffCall<OrderPage> {
  const query: Record<string, string> = { limit: String(ordersPageSize) }
  const named: ReadonlyArray<readonly [string, string | undefined]> = [
    ["createdFrom", filter.createdFrom],
    ["createdTo", filter.createdTo],
    ["merchant", filter.merchant],
    ["customer", filter.customer],
    ["orderNumber", filter.orderNumber],
    ["before", filter.before]
  ]

  if (filter.statuses.length > 0) {
    query.status = filter.statuses.join(",")
  }

  for (const [name, value] of named) {
    if (value !== undefined) {
      query[name] = value
    }
  }

  return {
    endpoint: "order.searchOrders",
    method: "GET",
    path: "/bff/api/v1/orders/search",
    query,
    schema: orderPageSchema
  }
}

export { ordersPageSize, searchOrdersCall }
