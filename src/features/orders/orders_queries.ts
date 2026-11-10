import { queryOptions, skipToken } from "@tanstack/react-query"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { bffRequest } from "../../api/bff_request"
import { attentionSagasCall } from "../../api/calls/attention_sagas_call"
import { orderCall } from "../../api/calls/order_call"
import { returnsNeedingAttentionCall } from "../../api/calls/returns_needing_attention_call"
import { searchOrdersCall } from "../../api/calls/search_orders_call"
import type { OrderDetail } from "../../types/order_detail.type"
import type { OrderPage } from "../../types/order_page.type"
import type { OrderQuery } from "../../types/order_query.type"
import { returnsKey } from "../overview/overview_queries"

const ordersKey = ["bff", "orders"] as const

const searchKey = [...ordersKey, "search"] as const

const sagaListKey = [...ordersKey, "sagas"] as const

function orderSearchQuery(filter: OrderQuery) {
  return queryOptions({
    queryKey: [...searchKey, filter],
    queryFn: ({ signal }) => bffFetch(searchOrdersCall(filter), signal)
  })
}

function numberOnly(orderNumber: string): OrderQuery {
  return {
    statuses: [],
    createdFrom: undefined,
    createdTo: undefined,
    merchant: undefined,
    customer: undefined,
    orderNumber,
    before: undefined
  }
}

function orderRowQuery(orderNumber: string | null) {
  const filter = numberOnly(orderNumber ?? "")

  return queryOptions({
    queryKey: [...searchKey, filter],
    queryFn:
      orderNumber === null ? skipToken : ({ signal }): Promise<OrderPage> => bffFetch(searchOrdersCall(filter), signal)
  })
}

function orderKey(orderId: string) {
  return [...ordersKey, "order", orderId] as const
}

async function readOrder(orderId: string, signal: AbortSignal): Promise<OrderDetail | null> {
  const result = await bffRequest(orderCall(orderId), { signal })
  if (result.ok) {
    return result.value
  }

  if (result.failure.kind === "refused" && result.failure.status === 404) {
    return null
  }

  throw new BffError(result.failure)
}

function orderQuery(orderId: string | null) {
  return queryOptions({
    queryKey: orderKey(orderId ?? ""),
    queryFn: orderId === null ? skipToken : ({ signal }) => readOrder(orderId, signal)
  })
}

function attentionReturnsQuery() {
  return queryOptions({
    queryKey: returnsKey,
    queryFn: ({ signal }) => bffFetch(returnsNeedingAttentionCall, signal)
  })
}

function attentionSagasQuery() {
  return queryOptions({
    queryKey: sagaListKey,
    queryFn: ({ signal }) => bffFetch(attentionSagasCall, signal)
  })
}

export {
  attentionReturnsQuery,
  attentionSagasQuery,
  orderKey,
  orderQuery,
  orderRowQuery,
  orderSearchQuery,
  ordersKey,
  sagaListKey,
  searchKey
}
