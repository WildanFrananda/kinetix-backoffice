import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query"
import { createRouter } from "@tanstack/react-router"
import type { BffError } from "./api/bff_error"
import { retryDelay, shouldRetry } from "./api/retry_policy"
import { leaveSession } from "./features/session/leave_session"
import { announceSession } from "./features/session/session_channel"
import { routeTree } from "./routeTree.gen"
import { ErrorPage } from "./ui/ErrorPage"
import { NotFoundPage } from "./ui/NotFoundPage"

function getRouter() {
  let leaving = false

  function sessionLost(error: BffError): void {
    const kind = error.failure.kind
    if (kind !== "signed-out" && kind !== "role-refused") {
      return
    }

    const location = router.state.location
    if (leaving || location.pathname === "/sign-in") {
      return
    }

    leaving = true
    announceSession({ type: "signed-out" })

    const notice = kind === "role-refused" ? "role-refused" : "session-ended"

    function go(): Promise<void> {
      return router.navigate({ to: "/sign-in", search: { redirect: location.href, notice } })
    }

    void leaveSession(queryClient, go).finally(() => {
      leaving = false
    })
  }

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: sessionLost }),
    mutationCache: new MutationCache({ onError: sessionLost }),
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        retryDelay,
        staleTime: 30_000
      },
      mutations: {
        retry: false
      }
    }
  })

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    defaultErrorComponent: ErrorPage,
    defaultNotFoundComponent: NotFoundPage,
    scrollRestoration: true
  })

  return router
}

export { getRouter }
