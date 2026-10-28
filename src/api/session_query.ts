import { queryOptions } from "@tanstack/react-query"
import { bffFetch } from "./bff_fetch"
import { meCall } from "./calls/me_call"
import { sessionCall } from "./calls/session_call"

function sessionQuery() {
  return queryOptions({
    queryKey: ["bff", "session"],
    queryFn: ({ signal }) => bffFetch(sessionCall, signal),
    staleTime: 0,
    refetchOnWindowFocus: true
  })
}

function accountQuery() {
  return queryOptions({
    queryKey: ["bff", "account"],
    queryFn: ({ signal }) => bffFetch(meCall, signal),
    staleTime: 60_000
  })
}

export { accountQuery, sessionQuery }
