import { queryOptions } from "@tanstack/react-query"
import { bffFetch } from "../../api/bff_fetch"
import { categoriesCall } from "../../api/calls/categories_call"

const categoriesKey = ["bff", "categories"] as const

function categoriesQuery() {
  return queryOptions({
    queryKey: categoriesKey,
    queryFn: ({ signal }) => bffFetch(categoriesCall, signal)
  })
}

export { categoriesKey, categoriesQuery }
