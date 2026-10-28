import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider
} from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PageHeader } from "../../src/ui/PageHeader"
import { AppShell } from "../../src/ui/shell/AppShell"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { adminSession } from "../support/edge_answers"
import { fakeBff } from "../support/fake_bff"

let bff = fakeBff({})

afterEach(() => {
  expect(bff.unexpected).toEqual([])
  vi.unstubAllGlobals()
})

function shellAt(path: string) {
  const outside = createRootRoute()

  const root = createRoute({
    getParentRoute: () => outside,
    id: "shell",
    component: () => (
      <AppShell>
        <Outlet />
      </AppShell>
    )
  })

  const overview = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <PageHeader eyebrow="Workspace" title="Overview" />
  })

  const account = createRoute({
    getParentRoute: () => root,
    path: "/account",
    component: () => <PageHeader eyebrow="Workspace" title="Account" />
  })

  const signIn = createRoute({
    getParentRoute: () => outside,
    path: "/sign-in",
    component: () => <h1>Sign in</h1>
  })

  return createRouter({
    routeTree: outside.addChildren([root.addChildren([overview, account]), signIn]),
    history: createMemoryHistory({ initialEntries: [path] })
  })
}

describe("the app shell", () => {
  it("opens the command palette on Ctrl+K and goes where it is told", async () => {
    bff = fakeBff({
      "GET /bff/session": () => Response.json(adminSession()),
      "GET /bff/api/v1/auth/me": () =>
        Response.json({
          principalId: "3c9d2e7a-6b1f-4d8e-a5c4-7e2f1b0a9d8c",
          userId: 1,
          email: "admin@example.com",
          role: "admin",
          expiresAt: "2026-10-28T20:00:00.000Z"
        })
    })

    const router = shellAt("/")
    render(
      <AppProviders client={testQueryClient()}>
        <RouterProvider router={router} />
      </AppProviders>
    )

    expect(await screen.findByRole("heading", { level: 1, name: "Overview" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main")

    const user = userEvent.setup()
    await user.keyboard("{Control>}k{/Control}")

    const search = await screen.findByRole("searchbox", { name: "Command palette" })
    await user.type(search, "acc")
    expect(screen.queryByRole("menuitem", { name: /Light theme/ })).toBeNull()
    await user.keyboard("{ArrowDown}{Enter}")

    await waitFor(() => expect(router.state.location.pathname).toBe("/account"))
    const heading = await screen.findByRole("heading", { level: 1, name: "Account" })
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("closes the command palette on the first Escape, even with text typed", async () => {
    bff = fakeBff({
      "GET /bff/session": () => Response.json(adminSession()),
      "GET /bff/api/v1/auth/me": () => Response.json({ message: "down" }, { status: 503 })
    })

    render(
      <AppProviders client={testQueryClient()}>
        <RouterProvider router={shellAt("/")} />
      </AppProviders>
    )

    expect(await screen.findByRole("heading", { level: 1, name: "Overview" })).toBeInTheDocument()

    const user = userEvent.setup()
    await user.keyboard("{Control>}k{/Control}")
    await user.type(await screen.findByRole("searchbox", { name: "Command palette" }), "th")
    await user.keyboard("{Escape}")

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("passes axe with its navigation, bar and account block", async () => {
    bff = fakeBff({
      "GET /bff/session": () => Response.json(adminSession()),
      "GET /bff/api/v1/auth/me": () => Response.json({ message: "down" }, { status: 503 })
    })

    const { container } = render(
      <AppProviders client={testQueryClient()}>
        <RouterProvider router={shellAt("/")} />
      </AppProviders>
    )

    expect(await screen.findByRole("navigation", { name: "Backoffice sections" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page")
    expect(await axeViolations(container)).toEqual([])
  })

  it("signs out without asking the API anything more", async () => {
    bff = fakeBff({
      "GET /bff/session": () => Response.json(adminSession()),
      "GET /bff/api/v1/auth/me": () =>
        Response.json({
          principalId: "3c9d2e7a-6b1f-4d8e-a5c4-7e2f1b0a9d8c",
          userId: 1,
          email: "admin@example.com",
          role: "admin",
          expiresAt: "2026-10-28T20:00:00.000Z"
        }),
      "POST /bff/logout": () => new Response(null, { status: 204 })
    })

    const router = shellAt("/")
    render(
      <AppProviders client={testQueryClient()}>
        <RouterProvider router={router} />
      </AppProviders>
    )

    expect(await screen.findByText("admin@example.com")).toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole("button", { name: "Sign out" }))
    await waitFor(() => expect(router.state.location.pathname).toBe("/sign-in"))

    const seen = bff.seen.map((request) => request.route)
    const after = seen.slice(seen.indexOf("POST /bff/logout") + 1)
    expect(after).toEqual([])
  })
})
