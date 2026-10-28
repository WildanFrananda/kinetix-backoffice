import type { QueryClient } from "@tanstack/react-query"

async function leaveSession(queryClient: QueryClient, go: () => Promise<void>): Promise<void> {
  await queryClient.cancelQueries()
  await go()
  queryClient.clear()
}

export { leaveSession }
