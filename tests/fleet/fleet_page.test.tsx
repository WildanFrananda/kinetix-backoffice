import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { FleetPage } from "../../src/features/fleet/FleetPage"
import { dispatchSearch, fleetSearch } from "../../src/features/fleet/fleet_search"
import { inPlace } from "../../src/ui/in_place"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"
import { busyCourier, idleCourier, pendingJob, refusal, unplacedCourier } from "../support/matching_answers"

vi.mock("../../src/api/governor", async () => {
  const { createRequestGovernor } = await import("../../src/api/request_governor")

  return {
    requestsPerMinute: 80,
    governor: createRequestGovernor({
      limit: Number.MAX_SAFE_INTEGER,
      windowMs: 60_000,
      now: Date.now,
      channelName: null
    })
  }
})

vi.mock("../../src/ui/webgl2", () => ({ supportsWebgl2: () => false }))

let bff = fakeBff({})

afterEach(() => {
  expect(bff.unexpected).toEqual([])
  vi.unstubAllGlobals()
})

const assignedJob = { ...pendingJob, status: "assigned", driver_id: 17, assigned_at: "2026-10-22T03:15:02.187430Z" }

function fleet(extra: Record<string, (request: Request) => Response> = {}) {
  return {
    "GET /bff/api/v1/matching/drivers": () => Response.json({ data: [unplacedCourier, busyCourier, idleCourier] }),
    "GET /bff/api/v1/matching/backoffice/drivers/17/dispatches": () => Response.json({ data: [assignedJob] }),
    "GET /bff/api/v1/matching/backoffice/drivers/21/dispatches": () => Response.json({ data: [] }),
    ...extra
  }
}

function show(path: string) {
  const root = createRootRoute()

  const page = createRoute({
    getParentRoute: () => root,
    path: "/fleet",
    validateSearch: fleetSearch,
    component: function FleetRoute() {
      const navigate = page.useNavigate()

      return <FleetPage search={page.useSearch()} onSearch={(next) => void navigate({ search: next, ...inPlace })} />
    }
  })

  const board = createRoute({
    getParentRoute: () => root,
    path: "/dispatch",
    validateSearch: dispatchSearch,
    component: () => null
  })

  const router = createRouter({
    routeTree: root.addChildren([page, board]),
    history: createMemoryHistory({ initialEntries: [path] })
  })

  const view = render(
    <AppProviders client={testQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>
  )

  return { router, ...view }
}

describe("the fleet", () => {
  it("lists every tracked courier, online first, draws those with a position, and is accessible", async () => {
    bff = fakeBff(fleet())

    const { container } = show("/fleet")

    await screen.findByRole("option", { name: /Courier 21/ })
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      expect.stringContaining("Courier 21"),
      expect.stringContaining("Courier 17"),
      expect.stringContaining("Courier 9")
    ])

    expect(screen.getByText("3 tracked")).toBeInTheDocument()
    expect(screen.getByText("no position")).toBeInTheDocument()
    expect(
      screen.getByRole("img", { name: "Map of the fleet, drawn on a latitude and longitude grid without streets" })
    ).toBeInTheDocument()

    expect(container.querySelectorAll("figure circle[data-kind='courier']:not(ul circle)")).toHaveLength(2)
    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("Online courierBusy courier")
    expect(await axeViolations(container)).toEqual([])
  })

  it("shows a courier and the jobs they hold, linked to the board", async () => {
    bff = fakeBff(fleet())

    const user = userEvent.setup()
    const { router } = show("/fleet")

    await screen.findByRole("option", { name: /Courier 21/ })
    await user.keyboard("jj")
    await waitFor(() => expect(router.state.location.search).toEqual({ courier: 17 }))

    const detail = await screen.findByRole("article", { name: "Courier 17" })
    expect(within(detail).getByText("24.5 km/h")).toBeInTheDocument()
    expect(within(detail).getByText("87.5°")).toBeInTheDocument()
    expect(within(detail).getByText("-6.18010, 106.82950")).toBeInTheDocument()

    const link = await within(detail).findByRole("link", { name: "Open job 4813 on the board" })
    expect(link).toHaveAttribute("href", "/dispatch?job=4813")
    expect(screen.getByRole("list", { name: "Legend" })).toHaveTextContent("Pickup")
  })

  it("filters by duty and by number, with / to the filter", async () => {
    bff = fakeBff(fleet())

    const user = userEvent.setup()
    const { router } = show("/fleet")

    await screen.findByRole("option", { name: /Courier 21/ })
    await user.click(screen.getByRole("radio", { name: "Offline" }))
    await waitFor(() => expect(router.state.location.search).toEqual({ status: "offline" }))
    expect(screen.getAllByRole("option")).toHaveLength(1)

    await user.click(screen.getByRole("radio", { name: "All" }))
    await user.keyboard("/")
    expect(screen.getByRole("searchbox", { name: "Find a courier" })).toHaveFocus()
    await user.keyboard("21")
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      expect.stringContaining("Courier 21")
    ])
  })

  it("says when matching does not track a courier", async () => {
    bff = fakeBff(
      fleet({
        "GET /bff/api/v1/matching/drivers/99": refusal(404, "not_found"),
        "GET /bff/api/v1/matching/backoffice/drivers/99/dispatches": () => Response.json({ data: [] })
      })
    )

    show("/fleet?courier=99")

    expect(await screen.findByText("Matching does not track courier 99 right now.")).toBeInTheDocument()
  })
})
