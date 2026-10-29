import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider
} from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { sessionQuery } from "../../src/api/session_query"
import { SessionWatch } from "../../src/features/session/SessionWatch"
import { signInSearch } from "../../src/features/sign_in/sign_in_search"
import type { RouterContext } from "../../src/types/router_context.type"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { adminSession } from "../support/edge_answers"
import { fakeBff } from "../support/fake_bff"

let bff = fakeBff({})

afterEach(() => {
  expect(bff.unexpected).toEqual([])
  vi.unstubAllGlobals()
})

function appAt(path: string) {
  const queryClient = testQueryClient()
  const root = createRootRouteWithContext<RouterContext>()()

  const signedIn = createRoute({
    getParentRoute: () => root,
    id: "signed-in",
    beforeLoad: ({ context }) => context.queryClient.fetchQuery({ ...sessionQuery(), staleTime: 30_000 }),
    component: () => (
      <>
        <SessionWatch />
        <Outlet />
      </>
    )
  })

  const page = createRoute({
    getParentRoute: () => signedIn,
    path: "/approvals/sellers",
    component: () => <h1>Seller applications</h1>
  })

  const signIn = createRoute({
    getParentRoute: () => root,
    path: "/sign-in",
    validateSearch: signInSearch,
    beforeLoad: ({ context }) => context.queryClient.fetchQuery({ ...sessionQuery(), staleTime: 0 }),
    component: () => <h1>Sign in</h1>
  })

  const router = createRouter({
    routeTree: root.addChildren([signedIn.addChildren([page]), signIn]),
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient }
  })

  render(
    <AppProviders client={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  )

  return { router, queryClient }
}

describe("a session that ends while a page is open", () => {
  it("goes to the sign-in once, keeping the page it left, however long the session read takes", async () => {
    let ended = false
    bff = fakeBff({
      "GET /bff/session": async () => {
        if (!ended) {
          return Response.json(adminSession())
        }

        await new Promise((resolve) => setTimeout(resolve, 40))

        return Response.json({ authenticated: false })
      }
    })

    const { router, queryClient } = appAt("/approvals/sellers")
    expect(await screen.findByRole("heading", { name: "Seller applications" })).toBeInTheDocument()

    ended = true
    await queryClient.invalidateQueries({ queryKey: sessionQuery().queryKey })

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument()
    await waitFor(() => expect(router.state.status).toBe("idle"))
    expect(router.state.location.pathname).toBe("/sign-in")
    expect(router.state.location.search).toEqual({ redirect: "/approvals/sellers", notice: "session-ended" })
    expect(bff.seen.filter((request) => request.route === "GET /bff/session").length).toBeLessThanOrEqual(6)
  })
})
