import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { AccountPage } from "../../src/features/session/AccountPage"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"

let bff = fakeBff({})

const noPasskeys = { "GET /bff/api/v1/auth/passkeys/1": () => Response.json({ passkeys: [] }) }

afterEach(() => {
  expect(bff.unexpected).toEqual([])
  vi.unstubAllGlobals()
})

function sessionUntil(minutes: number) {
  return () =>
    Response.json({
      authenticated: true,
      role: "admin",
      principalId: "3c9d2e7a-6b1f-4d8e-a5c4-7e2f1b0a9d8c",
      expiresAt: new Date(Date.now() + minutes * 60_000).toISOString()
    })
}

function me(): Response {
  return Response.json({
    principalId: "3c9d2e7a-6b1f-4d8e-a5c4-7e2f1b0a9d8c",
    userId: 1,
    email: "admin@example.com",
    role: "admin",
    expiresAt: "2026-10-29T20:00:00.000Z"
  })
}

function show() {
  const router = createRouter({
    routeTree: createRootRoute({ component: AccountPage }),
    history: createMemoryHistory({ initialEntries: ["/"] })
  })

  return render(
    <AppProviders client={testQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>
  )
}

describe("the account page", () => {
  it("names the admin, counts down the session, and is accessible", async () => {
    bff = fakeBff({ "GET /bff/api/v1/auth/me": me, "GET /bff/session": sessionUntil(11.5), ...noPasskeys })

    const { container } = show()

    expect(await screen.findByRole("heading", { level: 2, name: "admin@example.com" })).toBeInTheDocument()
    expect(await screen.findByText(/^11:\d\d$/)).toBeInTheDocument()
    expect(screen.getByText("AD").getAttribute("aria-hidden")).toBe("true")
    expect(screen.getByText(/^KX<BACKOFFICE<<ADMIN/).closest("[aria-hidden]")).not.toBeNull()
    expect(screen.getByRole("button", { name: "Copy Principal" })).toBeInTheDocument()
    expect(screen.getByText("12", { selector: "dd" })).toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("stays signed in by using the session, then reads its new end", async () => {
    let uses = 0
    bff = fakeBff({
      ...noPasskeys,
      "GET /bff/api/v1/auth/me": () => {
        uses += 1

        return me()
      },
      "GET /bff/session": () => (uses > 1 ? sessionUntil(14.5)() : sessionUntil(3.5)())
    })

    const user = userEvent.setup()
    show()
    await screen.findByText("4", { selector: "dd" })
    const before = bff.seen.filter((request) => request.route === "GET /bff/api/v1/auth/me").length

    await user.click(screen.getByRole("button", { name: "Stay signed in" }))

    expect(await screen.findByText(/^Extended\. The session now ends at/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText("15", { selector: "dd" })).toBeInTheDocument())
    expect(bff.seen.filter((request) => request.route === "GET /bff/api/v1/auth/me").length).toBe(before + 1)
  })
})
