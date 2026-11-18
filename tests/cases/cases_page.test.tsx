import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CasesPage } from "../../src/features/cases/CasesPage"
import { casesSearch } from "../../src/features/cases/cases_search"
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

const merchantA = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d"
const merchantB = "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d"

const summaryA = {
  merchantPrincipalId: merchantA,
  merchantTag: "3a".repeat(32),
  merchant: {
    storeName: "Toko Amanah",
    status: "verified"
  },
  confirmedCount: 2,
  pendingCount: 1,
  totalCount: 3,
  windowCount: 2,
  earliestWindow: 202610,
  latestWindow: 202611,
  firstReportedAt: "2026-10-20T08:00:00.000Z",
  latestReportedAt: "2026-11-05T12:00:00.000Z",
  categories: [{ slug: "counterfeit", label: "Counterfeit product", count: 3 }]
}

const summaryB = {
  merchantPrincipalId: merchantB,
  merchantTag: "4b".repeat(32),
  merchant: {
    storeName: null,
    status: null
  },
  confirmedCount: 0,
  pendingCount: 1,
  totalCount: 1,
  windowCount: 1,
  earliestWindow: 202611,
  latestWindow: 202611,
  firstReportedAt: "2026-11-06T09:00:00.000Z",
  latestReportedAt: "2026-11-06T09:00:00.000Z",
  categories: [{ slug: "fraud", label: "Fraud or misrepresentation", count: 1 }]
}

const detailA = {
  ...summaryA,
  reports: [
    {
      nullifier: "7b".repeat(32),
      category: { slug: "counterfeit", label: "Counterfeit product" },
      body: "seal was broken before arrival",
      window: 202611,
      status: "confirmed",
      firstGeneration: 1,
      txId: "007c".padEnd(64, "c"),
      submittedAt: "2026-11-05T12:00:00.000Z",
      confirmedAt: "2026-11-05T12:03:00.000Z"
    }
  ]
}

function show(path: string) {
  const root = createRootRoute()

  const page = createRoute({
    getParentRoute: () => root,
    path: "/seal/cases",
    validateSearch: casesSearch,
    component: function CasesRoute() {
      const navigate = page.useNavigate()

      return <CasesPage search={page.useSearch()} onSearch={(next) => void navigate({ search: next, ...inPlace })} />
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

  return { ...view, router }
}

describe("the merchant report cases screen", () => {
  it("lists merchant cases, handles missing identity profiles, and is accessible", async () => {
    bff = fakeBff({
      "GET /bff/api/v1/seal/cases": () => Response.json({ cases: [summaryA, summaryB] })
    })

    const { container } = show("/seal/cases")

    expect(await screen.findByText("Toko Amanah")).toBeInTheDocument()
    expect(screen.getByText("Unnamed merchant (1a2b3c4d)")).toBeInTheDocument()
    expect(screen.getByText("Unavailable from identity")).toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("opens case detail and filters by chain confirmation status", async () => {
    const user = userEvent.setup()

    bff = fakeBff({
      "GET /bff/api/v1/seal/cases": (request) => {
        if (new URL(request.url).searchParams.get("status") === "confirmed") {
          return Response.json({ cases: [summaryA] })
        }

        return Response.json({ cases: [summaryA, summaryB] })
      },
      [`GET /bff/api/v1/seal/cases/${merchantA}`]: () => Response.json(detailA)
    })

    const { container, router } = show("/seal/cases")

    expect(await screen.findByText("Toko Amanah")).toBeInTheDocument()
    await user.click(screen.getByText("Toko Amanah"))

    expect(await screen.findByText("seal was broken before arrival")).toBeInTheDocument()
    expect(router.state.location.search).toEqual({ selected: merchantA })
    expect(await axeViolations(container)).toEqual([])

    await user.click(screen.getByRole("button", { name: "Confirmed" }))

    await waitFor(() => expect(router.state.location.search).toEqual({ selected: merchantA, status: "confirmed" }))
    expect(screen.queryByText("Unnamed merchant (1a2b3c4d)")).not.toBeInTheDocument()
  })

  it("moves across merchants with J and K", async () => {
    const user = userEvent.setup()

    bff = fakeBff({
      "GET /bff/api/v1/seal/cases": () => Response.json({ cases: [summaryA, summaryB] }),
      [`GET /bff/api/v1/seal/cases/${merchantA}`]: () => Response.json(detailA),
      [`GET /bff/api/v1/seal/cases/${merchantB}`]: () => Response.json({ ...summaryB, reports: [] })
    })

    const { router } = show("/seal/cases")

    expect(await screen.findByText("Toko Amanah")).toBeInTheDocument()
    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: merchantA }))
    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: merchantB }))
    await user.keyboard("k")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: merchantA }))
  })
})
