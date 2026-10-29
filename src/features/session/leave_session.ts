import { hashKey, type QueryClient } from "@tanstack/react-query"
import { sessionQuery } from "../../api/session_query"

let leaving: Promise<void> | null = null

async function leave(queryClient: QueryClient, go: () => Promise<void>): Promise<void> {
  const session = hashKey(sessionQuery().queryKey)

  await queryClient.cancelQueries()
  await go()
  queryClient.removeQueries({ predicate: (query) => query.queryHash !== session })
}

function leaveSession(queryClient: QueryClient, go: () => Promise<void>): Promise<void> {
  if (leaving !== null) {
    return leaving
  }

  leaving = leave(queryClient, go).finally(() => {
    leaving = null
  })

  return leaving
}

export { leaveSession }
