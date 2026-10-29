import { createMemoryHistory, createRootRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { OverviewPage } from "../../src/features/overview/OverviewPage"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"
import { attentionReturns, courierPage, dispatchSummary, sellerPage } from "../support/overview_answers"

let bff = fakeBff({})

afterEach(() => {
  expect(bff.unexpected).toEqual([])
  vi.unstubAllGlobals()
})

function overviewRouter() {
  return createRouter({
    routeTree: createRootRoute({ component: OverviewPage }),
    history: createMemoryHistory({ initialEntries: ["/"] })
  })
}

function liveRoutes() {
  return {
    "GET /bff/api/v1/matching/backoffice/dispatches/summary": () => Response.json(dispatchSummary()),
    "GET /bff/api/v1/sellers/applications": () => Response.json(sellerPage(200, 201)),
    "GET /bff/api/v1/couriers/applications": () =>
      Response.json(courierPage(["2026-10-26T07:42:10.226Z", "2026-10-24T07:00:00.000Z"])),
    "GET /bff/api/v1/orders/sagas/needs-attention/count": () => Response.json(1),
    "GET /bff/api/v1/orders/returns/needs-attention": () => Response.json(attentionReturns())
  }
}

function figure(label: string): HTMLElement {
  const term = screen.getByText(label, { selector: "dt" })
  const holder = term.parentElement
  if (holder === null) {
    throw new Error(`no figure for ${label}`)
  }

  return holder
}

function spoken(label: string): string | null {
  const said = figure(label).querySelector("dd > span:not([aria-hidden])")

  return said?.textContent ?? null
}

async function spokenSoon(label: string, value: string): Promise<void> {
  await waitFor(() => expect(spoken(label)).toBe(value))
}

describe("the overview", () => {
  it("reads every queue from its service and says each figure as a number", async () => {
    bff = fakeBff(liveRoutes())
    const { container } = render(
      <AppProviders client={testQueryClient()}>
        <RouterProvider router={overviewRouter()} />
      </AppProviders>
    )

    await spokenSoon("Pending", "3")
    await spokenSoon("Active", "11")
    await spokenSoon("Delivered today", "42")
    await spokenSoon("Sellers waiting", "200+")
    await spokenSoon("Couriers waiting", "2")
    await spokenSoon("Stuck checkouts", "1")
    await spokenSoon("Returns", "2")

    const table = await screen.findByRole("table", { name: /^Latest returns/ })
    const rows = within(table).getAllByRole("row")
    expect(rows).toHaveLength(3)
    expect(within(rows[1] as HTMLElement).getByText("RMA-20261020-9A1C3E5F")).toBeInTheDocument()

    const asked = new Set(bff.seen.map((request) => request.route))
    expect(asked.size).toBe(5)
    expect(await axeViolations(container)).toEqual([])
  })

  it("keeps a panel's failure inside that panel", async () => {
    bff = fakeBff({
      ...liveRoutes(),
      "GET /bff/api/v1/matching/backoffice/dispatches/summary": () =>
        Response.json({ error: "MATCHING_UNAVAILABLE", message: "down" }, { status: 503 })
    })

    render(
      <AppProviders client={testQueryClient()}>
        <RouterProvider router={overviewRouter()} />
      </AppProviders>
    )

    const dispatch = await screen.findByRole("region", { name: "Dispatch" })
    expect(await within(dispatch).findByRole("alert")).toHaveTextContent(/unavailable|cannot/i)
    expect(within(dispatch).getByRole("button", { name: "Try again" })).toBeInTheDocument()

    const approvals = screen.getByRole("region", { name: "Approvals" })
    await spokenSoon("Sellers waiting", "200+")
    expect(within(approvals).queryByRole("alert")).toBeNull()
  })

  it("shows a dash, never a zero, until a figure has been read", async () => {
    bff = fakeBff({})
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => undefined))
    )

    render(
      <AppProviders client={testQueryClient()}>
        <RouterProvider router={overviewRouter()} />
      </AppProviders>
    )

    await screen.findByText("Pending", { selector: "dt" })
    expect(spoken("Pending")).toBe("—")
    expect(figure("Pending").textContent).not.toContain("0")
  })
})
