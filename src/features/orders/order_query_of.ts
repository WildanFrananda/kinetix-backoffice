import { orderStatuses } from "../../api/schemas/order_statuses"
import type { OrderQuery } from "../../types/order_query.type"
import type { OrderStatus } from "../../types/order_status.type"
import type { OrdersSearch } from "../../types/orders_search.type"
import { startOfDay } from "./local_day"

function statusesOf(value: string | undefined): readonly OrderStatus[] {
  if (value === undefined) {
    return []
  }

  const named = new Set(value.split(","))

  return orderStatuses.filter((status) => named.has(status))
}

function orderQueryOf(search: OrdersSearch): OrderQuery {
  return {
    statuses: statusesOf(search.status),
    createdFrom: search.from === undefined ? undefined : startOfDay(search.from, 0),
    createdTo: search.to === undefined ? undefined : startOfDay(search.to, 1),
    merchant: search.merchant,
    customer: search.customer,
    orderNumber: search.orderNumber,
    before: search.before
  }
}

function filtered(search: OrdersSearch): boolean {
  return [search.status, search.from, search.to, search.merchant, search.customer, search.orderNumber].some(
    (value) => value !== undefined
  )
}

export { filtered, orderQueryOf, statusesOf }
