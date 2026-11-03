import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PredicatesPage } from "../../src/features/predicates/PredicatesPage"
import { predicatesSearch } from "../../src/features/predicates/predicates_search"
import { inPlace } from "../../src/ui/in_place"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"

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

let bff = fakeBff({})

afterEach(() => {
  expect(bff.unexpected).toEqual([])
  vi.unstubAllGlobals()
})

const experienced = {
  id: "4b5c6d7e-8f90-4a1b-9c2d-3e4f5a6b7c8d",
  status: "live",
  class: "courier",
  classId: "6b696e657469783a7365616c3a636f75726965723a7631000000000000000000",
  label: "Experienced courier",
  minimums: { deliveries: 100, ratingHundredths: 450, daysActive: 90 },
  freshnessDays: 30,
  approvedAt: "2026-11-03T03:00:00.000Z",
  withdrawnAt: null,
  rows: [
    {
      id: "a3".repeat(32),
      minimums: ["100", "450", "90", "20725"],
      minimumIssueDay: 20725,
      minimumIssueDate: "2026-09-29",
      current: true,
      placed: true
    },
    {
      id: "b4".repeat(32),
      minimums: ["100", "450", "90", "20718"],
      minimumIssueDay: 20718,
      minimumIssueDate: "2026-09-22",
      current: false,
      placed: false
    }
  ]
}

const registry = { generation: 1, contractAddress: "5e".repeat(32) }

function listed(predicates: unknown[]) {
  return () => Response.json({ registry, predicates })
}

function refusal(status: number, body: object) {
  return () => Response.json({ ...body, traceId: "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b" }, { status })
}

function show(path: string) {
  const root = createRootRoute()

  const page = createRoute({
    getParentRoute: () => root,
    path: "/seal/predicates",
    validateSearch: predicatesSearch,
    component: function PredicatesRoute() {
      const navigate = page.useNavigate()

      return (
        <PredicatesPage search={page.useSearch()} onSearch={(next) => void navigate({ search: next, ...inPlace })} />
      )
    }
  })

  const router = createRouter({
    routeTree: root.addChildren([page]),
    history: createMemoryHistory({ initialEntries: [path] })
  })

  const view = render(
    <AppProviders client={testQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>
  )

  return { router, ...view }
}

describe("credential checks", () => {
  it("lists the live checks with whether the registry holds them, and is accessible", async () => {
    bff = fakeBff({ "GET /bff/api/v1/seal/predicates": listed([experienced]) })

    const { container } = show("/seal/predicates")

    expect(await screen.findByRole("option", { name: /Experienced courier/ })).toBeInTheDocument()
    expect(screen.getByText("1 live")).toBeInTheDocument()
    expect(screen.getByText("Registry generation 1")).toBeInTheDocument()
    expect(screen.getByText("Being written to the registry")).toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("shows a check's minimums and its weekly rows", async () => {
    bff = fakeBff({ "GET /bff/api/v1/seal/predicates": listed([experienced]) })

    show(`/seal/predicates?selected=${experienced.id}`)

    const detail = await screen.findByRole("article", { name: "Experienced courier" })

    expect(within(detail).getByText("4.50")).toBeInTheDocument()
    expect(within(detail).getByText("30 days")).toBeInTheDocument()
    expect(within(detail).getAllByRole("row")).toHaveLength(3)
    expect(within(detail).getByText("In the registry")).toBeInTheDocument()
  })

  it("approves a check with the minimums seal takes, the rating in hundredths", async () => {
    let current: unknown[] = []
    bff = fakeBff({
      "GET /bff/api/v1/seal/predicates": () => Response.json({ registry, predicates: current }),
      "POST /bff/api/v1/seal/predicates": () => {
        current = [experienced]

        return Response.json(experienced, { status: 201 })
      }
    })

    const user = userEvent.setup()
    const { router } = show("/seal/predicates")

    await screen.findByText("No check is approved yet. Approve the first one.")
    await user.click(screen.getByRole("button", { name: "New check" }))
    await user.type(await screen.findByRole("textbox", { name: "Name" }), "  Experienced courier ")
    await user.type(screen.getByRole("textbox", { name: "Deliveries, at least" }), "100")
    await user.type(screen.getByRole("textbox", { name: "Rating, at least" }), "4,5")
    await user.type(screen.getByRole("textbox", { name: "Days active, at least" }), "90")
    await user.click(screen.getByRole("button", { name: "Approve check" }))

    expect(
      await screen.findByText("Approved “Experienced courier”. Seal is writing it to the registry.")
    ).toBeInTheDocument()

    expect(bff.seen.find((request) => request.route === "POST /bff/api/v1/seal/predicates")?.body).toEqual({
      class: "courier",
      label: "Experienced courier",
      minimums: { deliveries: 100, ratingHundredths: 450, daysActive: 90 },
      freshnessDays: 30
    })

    expect(router.state.location.search).toEqual({ selected: experienced.id })
  })

  it("refuses out-of-bounds values before asking seal", async () => {
    bff = fakeBff({ "GET /bff/api/v1/seal/predicates": listed([]) })

    const user = userEvent.setup()
    show("/seal/predicates?creating=true")

    await user.type(await screen.findByRole("textbox", { name: "Name" }), "Too good")
    await user.type(screen.getByRole("textbox", { name: "Rating, at least" }), "6")
    await user.click(screen.getByRole("button", { name: "Approve check" }))

    expect(await screen.findByText("Use a rating from 0 to 5, such as 4.5.")).toBeInTheDocument()
    expect(bff.seen.some((request) => request.route === "POST /bff/api/v1/seal/predicates")).toBe(false)
  })

  it("explains a duplicate in the admin's language and quotes seal", async () => {
    bff = fakeBff({
      "GET /bff/api/v1/seal/predicates": listed([experienced]),
      "POST /bff/api/v1/seal/predicates": refusal(409, {
        error: "PREDICATE_EXISTS",
        message: "a live predicate already has these minimums"
      })
    })

    const user = userEvent.setup()
    show("/seal/predicates?creating=true")

    await user.type(await screen.findByRole("textbox", { name: "Name" }), "Again")
    await user.type(screen.getByRole("textbox", { name: "Deliveries, at least" }), "100")
    await user.type(screen.getByRole("textbox", { name: "Rating, at least" }), "4.5")
    await user.type(screen.getByRole("textbox", { name: "Days active, at least" }), "90")
    await user.click(screen.getByRole("button", { name: "Approve check" }))

    expect(await screen.findByText("A live check already asks for exactly these minimums.")).toBeInTheDocument()
    expect(screen.getByText("a live predicate already has these minimums")).toBeInTheDocument()
  })

  it("withdraws after a confirmation with Cancel focused", async () => {
    let current: unknown[] = [experienced]
    bff = fakeBff({
      "GET /bff/api/v1/seal/predicates": () => Response.json({ registry, predicates: current }),
      [`DELETE /bff/api/v1/seal/predicates/${experienced.id}`]: () => {
        current = []

        return new Response(null, { status: 204 })
      }
    })

    const user = userEvent.setup()
    const { router } = show(`/seal/predicates?selected=${experienced.id}`)

    await user.click(await screen.findByRole("button", { name: "Withdraw…" }))

    const dialog = await screen.findByRole("alertdialog", { name: "Withdraw “Experienced courier”?" })

    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus()

    await user.click(within(dialog).getByRole("button", { name: "Withdraw" }))

    expect(await screen.findByText("Withdrew “Experienced courier”.")).toBeInTheDocument()
    expect(router.state.location.search).toEqual({})
  })
})
