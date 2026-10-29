import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { approvalsSearch, inPlace } from "../../src/features/approvals/approvals_search"
import { CourierApprovalsPage } from "../../src/features/approvals/CourierApprovalsPage"
import { periodStarts } from "../../src/features/approvals/period_starts"
import { SellerApprovalsPage } from "../../src/features/approvals/SellerApprovalsPage"
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

function seller(applicationId: number, userId: number, storeName: string) {
  return {
    applicationId,
    userId,
    principalId: `5d2a7c3e-8b14-4f6a-9e21-7c0b3d4e5f${String(applicationId).padStart(2, "0")}`,
    email: `${storeName.toLowerCase().replaceAll(" ", ".")}@example.com`,
    storeName,
    businessRegistrationNumber: "9120301234567",
    taxId: "01.234.567.8-012.000",
    streetAddress: "Jalan Flamboyan No. 8",
    city: "Jakarta Pusat",
    postalCode: "10330",
    status: "pending",
    verifiedAt: null,
    rejectedAt: null
  }
}

function courier(applicationId: number, userId: number, email: string) {
  return {
    applicationId,
    principalId: `3c9e2a41-7b5d-4f08-9a1c-2d6e8f0b4c${String(applicationId).padStart(2, "0")}`,
    userId,
    email,
    driverId: 100 + applicationId,
    status: "pending",
    filedAt: "2026-10-26T07:42:10.226Z",
    approvedAt: null,
    rejectedAt: null
  }
}

const sellers = [
  seller(12, 57, "Toko Kopi Kenari"),
  seller(13, 58, "Warung Sate Pak Budi"),
  seller(14, 59, "Roti Lapis")
]

const tallies: string[] = []

function tallyAnswer(request: Request): Response {
  const since = new URL(request.url).searchParams.get("since") ?? ""
  const starts = periodStarts(new Date())
  tallies.push(since)

  if (since === starts.day.toISOString()) {
    return Response.json({ since, approved: 3, rejected: 1 })
  }

  if (since === starts.week.toISOString()) {
    return Response.json({ since, approved: 9, rejected: 2 })
  }

  return Response.json({ since, approved: 31, rejected: 6 })
}

const queueCounts = {
  "GET /bff/api/v1/couriers/applications": () => Response.json({ applications: [], nextAfterId: null }),
  "GET /bff/api/v1/sellers/applications/tally": tallyAnswer
}

function profile(fullName: string) {
  return () => Response.json({ id: 1, userId: 57, fullName, phoneNumber: "+6281234567890" })
}

function pagesAt(path: string) {
  const root = createRootRoute()

  const sellerRoute = createRoute({
    getParentRoute: () => root,
    path: "/approvals/sellers",
    validateSearch: approvalsSearch,
    component: function SellerRoute() {
      const navigate = sellerRoute.useNavigate()

      return (
        <SellerApprovalsPage
          search={sellerRoute.useSearch()}
          onSearch={(next) => void navigate({ search: next, ...inPlace })}
        />
      )
    }
  })

  const courierRoute = createRoute({
    getParentRoute: () => root,
    path: "/approvals/couriers",
    validateSearch: approvalsSearch,
    component: function CourierRoute() {
      const navigate = courierRoute.useNavigate()

      return (
        <CourierApprovalsPage
          search={courierRoute.useSearch()}
          onSearch={(next) => void navigate({ search: next, ...inPlace })}
        />
      )
    }
  })

  return createRouter({
    routeTree: root.addChildren([sellerRoute, courierRoute]),
    history: createMemoryHistory({ initialEntries: [path] })
  })
}

function show(path: string) {
  const router = pagesAt(path)
  const view = render(
    <AppProviders client={testQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>
  )

  return { router, ...view }
}

function cells(table: HTMLElement, row: string): string[] {
  return within(within(table).getByRole("row", { name: new RegExp(`^${row}`) }))
    .getAllByRole("cell")
    .map((cell) => cell.textContent ?? "")
}

function asked(route: string): number {
  return bff.seen.filter((request) => request.route === route).length
}

describe("seller applications", () => {
  it("lists the waiting sellers, reads the oldest and its applicant, and is accessible", async () => {
    bff = fakeBff({
      ...queueCounts,
      "GET /bff/api/v1/sellers/applications": () => Response.json({ applications: sellers, nextAfterId: null }),
      "GET /bff/api/v1/users/57/profile": profile("Siti Rahmawati")
    })

    const { container } = show("/approvals/sellers")

    expect(await screen.findByRole("heading", { level: 2, name: "Toko Kopi Kenari" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Toko Kopi Kenari" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getAllByRole("option")).toHaveLength(3)
    expect(screen.getByText("01.234.567.8-012.000")).toBeInTheDocument()
    expect(await screen.findByText("Siti Rahmawati")).toBeInTheDocument()

    const listed = bff.seen.find((request) => request.route === "GET /bff/api/v1/sellers/applications")
    expect(listed).toBeDefined()
    expect(await axeViolations(container)).toEqual([])
  })

  it("moves with J and K, and keeps the choice in the address", async () => {
    bff = fakeBff({
      ...queueCounts,
      "GET /bff/api/v1/sellers/applications": () => Response.json({ applications: sellers, nextAfterId: null }),
      "GET /bff/api/v1/users/57/profile": profile("Siti Rahmawati"),
      "GET /bff/api/v1/users/58/profile": profile("Budi Santoso"),
      "GET /bff/api/v1/users/59/profile": profile("Rina Wijaya")
    })

    const user = userEvent.setup()
    const { router } = show("/approvals/sellers")
    await screen.findByRole("heading", { level: 2, name: "Toko Kopi Kenari" })

    await user.keyboard("j")
    expect(await screen.findByRole("heading", { level: 2, name: "Warung Sate Pak Budi" })).toBeInTheDocument()
    expect(router.state.location.search).toEqual({ selected: 13 })

    await user.keyboard("jk")
    expect(await screen.findByRole("heading", { level: 2, name: "Warung Sate Pak Budi" })).toBeInTheDocument()
  })

  it("keeps the page where it is when another application is chosen", async () => {
    bff = fakeBff({
      ...queueCounts,
      "GET /bff/api/v1/sellers/applications": () => Response.json({ applications: sellers, nextAfterId: null }),
      "GET /bff/api/v1/users/57/profile": profile("Siti Rahmawati"),
      "GET /bff/api/v1/users/59/profile": profile("Rina Wijaya")
    })

    const scrolled = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined)
    const user = userEvent.setup()
    show("/approvals/sellers")
    await screen.findByRole("heading", { level: 2, name: "Toko Kopi Kenari" })
    scrolled.mockClear()

    await user.click(screen.getByRole("option", { name: "Roti Lapis" }))
    expect(await screen.findByRole("heading", { level: 2, name: "Roti Lapis" })).toBeInTheDocument()
    await user.keyboard("k")
    await screen.findByRole("heading", { level: 2, name: "Warung Sate Pak Budi" })

    expect(scrolled).not.toHaveBeenCalled()
    scrolled.mockRestore()
  })

  it("approves after a confirmation, says so, and moves on to the next seller", async () => {
    let listed = sellers
    bff = fakeBff({
      ...queueCounts,
      "GET /bff/api/v1/sellers/applications": () => Response.json({ applications: listed, nextAfterId: null }),
      "GET /bff/api/v1/users/57/profile": profile("Siti Rahmawati"),
      "GET /bff/api/v1/users/58/profile": profile("Budi Santoso"),
      "POST /bff/api/v1/sellers/57/verify": () => {
        listed = sellers.slice(1)

        return Response.json({
          id: 8,
          userId: 57,
          storeName: "Toko Kopi Kenari",
          slug: "toko-kopi-kenari",
          status: "verified",
          verifiedAt: "2026-10-28T03:15:00.412Z",
          latitude: -6.1912,
          longitude: 106.8389,
          principalId: "5d2a7c3e-8b14-4f6a-9e21-7c0b3d4e5f12"
        })
      }
    })

    const user = userEvent.setup()
    show("/approvals/sellers")
    await screen.findByRole("heading", { level: 2, name: "Toko Kopi Kenari" })

    await user.keyboard("a")
    const dialog = await screen.findByRole("alertdialog", { name: "Approve Toko Kopi Kenari?" })
    expect(within(dialog).getByRole("button", { name: "Approve" })).toHaveFocus()
    expect(asked("POST /bff/api/v1/sellers/57/verify")).toBe(0)

    await user.keyboard("{Enter}")

    expect(await screen.findByText("Toko Kopi Kenari is a verified seller now.")).toBeInTheDocument()
    expect(await screen.findByRole("heading", { level: 2, name: "Warung Sate Pak Budi" })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("option", { name: "Toko Kopi Kenari" })).toBeNull())
    expect(asked("POST /bff/api/v1/sellers/57/verify")).toBe(1)
  })

  it("says when an approved store could not be placed on the map", async () => {
    bff = fakeBff({
      ...queueCounts,
      "GET /bff/api/v1/sellers/applications": () => Response.json({ applications: [sellers[0]], nextAfterId: null }),
      "GET /bff/api/v1/users/57/profile": profile("Siti Rahmawati"),
      "POST /bff/api/v1/sellers/57/verify": () =>
        Response.json({
          id: 8,
          userId: 57,
          storeName: "Toko Kopi Kenari",
          status: "verified",
          principalId: "5d2a7c3e-8b14-4f6a-9e21-7c0b3d4e5f12"
        })
    })

    const user = userEvent.setup()
    show("/approvals/sellers")
    await screen.findByRole("heading", { level: 2, name: "Toko Kopi Kenari" })

    await user.click(screen.getByRole("button", { name: "Approve" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Approve" }))

    expect(await screen.findByText(/could not be placed on the map/)).toBeInTheDocument()
  })

  it("asks before rejecting, with Cancel ready, and rejects only when told", async () => {
    bff = fakeBff({
      ...queueCounts,
      "GET /bff/api/v1/sellers/applications": () => Response.json({ applications: sellers, nextAfterId: null }),
      "GET /bff/api/v1/users/57/profile": profile("Siti Rahmawati"),
      "GET /bff/api/v1/users/58/profile": profile("Budi Santoso"),
      "POST /bff/api/v1/sellers/57/reject": () =>
        Response.json({ id: 12, userId: 57, storeName: "Toko Kopi Kenari", status: "rejected", principalId: null })
    })

    const user = userEvent.setup()
    show("/approvals/sellers")
    await screen.findByRole("heading", { level: 2, name: "Toko Kopi Kenari" })

    await user.keyboard("r")
    const dialog = await screen.findByRole("alertdialog", { name: "Reject Toko Kopi Kenari?" })
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus()

    await user.keyboard("{Enter}")
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    expect(asked("POST /bff/api/v1/sellers/57/reject")).toBe(0)

    await user.keyboard("r")
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Reject" }))

    expect(await screen.findByText("The application of Toko Kopi Kenari is rejected.")).toBeInTheDocument()
    expect(asked("POST /bff/api/v1/sellers/57/reject")).toBe(1)
  })

  it("counts the decisions of today, this week and this month from identity, and adds a new one at once", async () => {
    tallies.length = 0
    bff = fakeBff({
      ...queueCounts,
      "GET /bff/api/v1/sellers/applications": () => Response.json({ applications: sellers, nextAfterId: null }),
      "GET /bff/api/v1/users/57/profile": profile("Siti Rahmawati"),
      "GET /bff/api/v1/users/58/profile": profile("Budi Santoso"),
      "POST /bff/api/v1/sellers/57/reject": () =>
        Response.json({ id: 12, userId: 57, storeName: "Toko Kopi Kenari", status: "rejected", principalId: null })
    })

    const user = userEvent.setup()
    show("/approvals/sellers")
    const table = await screen.findByRole("table", { name: "Decided" })
    await waitFor(() => expect(cells(table, "Approved")).toEqual(["3", "9", "31"]))
    expect(cells(table, "Rejected")).toEqual(["1", "2", "6"])

    const starts = periodStarts(new Date())
    expect(tallies.sort()).toEqual([starts.day, starts.week, starts.month].map((start) => start.toISOString()).sort())

    await user.keyboard("r")
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Reject" }))

    await waitFor(() => expect(cells(table, "Rejected")).toEqual(["2", "3", "7"]))
    expect(cells(table, "Approved")).toEqual(["3", "9", "31"])
    expect(asked("GET /bff/api/v1/sellers/applications/tally")).toBe(3)
  })

  it("shows identity's refusal in its own words, changes nothing, and reads the list again", async () => {
    bff = fakeBff({
      ...queueCounts,
      "GET /bff/api/v1/sellers/applications": () => Response.json({ applications: sellers, nextAfterId: null }),
      "GET /bff/api/v1/users/57/profile": profile("Siti Rahmawati"),
      "POST /bff/api/v1/sellers/57/verify": () =>
        Response.json(
          {
            message: "Account 57 is a courier; making it a seller would revoke that role",
            error: "Conflict",
            statusCode: 409,
            traceId: "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b"
          },
          { status: 409 }
        )
    })

    const user = userEvent.setup()
    show("/approvals/sellers")
    await screen.findByRole("heading", { level: 2, name: "Toko Kopi Kenari" })
    const listedBefore = asked("GET /bff/api/v1/sellers/applications")

    await user.keyboard("a")
    await user.keyboard("{Enter}")

    const dialog = await screen.findByRole("alertdialog")
    expect(await within(dialog).findByText(/Identity refused, and nothing changed/)).toBeInTheDocument()
    expect(
      within(dialog).getByText("Account 57 is a courier; making it a seller would revoke that role")
    ).toHaveAttribute("lang", "en")

    await waitFor(() => expect(asked("GET /bff/api/v1/sellers/applications")).toBeGreaterThan(listedBefore))
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    expect(screen.getByRole("option", { name: "Toko Kopi Kenari" })).toBeInTheDocument()
  })

  it("lists decided applications without offering a decision", async () => {
    bff = fakeBff({
      ...queueCounts,
      "GET /bff/api/v1/sellers/applications": () =>
        Response.json({
          applications: [{ ...sellers[0], status: "verified", verifiedAt: "2026-10-27T03:15:00.412Z" }],
          nextAfterId: null
        }),
      "GET /bff/api/v1/users/57/profile": () =>
        Response.json(
          { message: "Profile not found for User ID 57", error: "Not Found", statusCode: 404 },
          { status: 404 }
        )
    })

    const user = userEvent.setup()
    show("/approvals/sellers?status=verified")
    await screen.findByRole("heading", { level: 2, name: "Toko Kopi Kenari" })

    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull()
    expect(await screen.findAllByText("No profile saved")).toHaveLength(2)

    await user.keyboard("a")
    expect(screen.queryByRole("alertdialog")).toBeNull()

    const verified = bff.seen.find((request) => request.route === "GET /bff/api/v1/sellers/applications")
    expect(verified).toBeDefined()
    expect(asked("GET /bff/api/v1/sellers/applications/tally")).toBe(0)
  })
})

describe("courier applications", () => {
  const couriers = [courier(5, 63, "kurir.budi@example.com"), courier(6, 64, "kurir.sari@example.com")]

  const courierRoutes = {
    "GET /bff/api/v1/sellers/applications": () => Response.json({ applications: [], nextAfterId: null }),
    "GET /bff/api/v1/couriers/applications": () => Response.json({ applications: couriers, nextAfterId: null }),
    "GET /bff/api/v1/couriers/applications/tally": tallyAnswer,
    "GET /bff/api/v1/users/63/profile": profile("Budi Kurniawan"),
    "GET /bff/api/v1/users/64/profile": profile("Sari Lestari")
  }

  it("approves a courier by its principal", async () => {
    bff = fakeBff({
      ...courierRoutes,
      "POST /bff/api/v1/couriers/3c9e2a41-7b5d-4f08-9a1c-2d6e8f0b4c05/approve": () =>
        Response.json({
          principalId: "3c9e2a41-7b5d-4f08-9a1c-2d6e8f0b4c05",
          email: "kurir.budi@example.com",
          role: "courier",
          driverId: 105,
          fleetActivated: true
        })
    })

    const user = userEvent.setup()
    const { container } = show("/approvals/couriers")
    await screen.findByRole("heading", { level: 2, name: "kurir.budi@example.com" })

    expect(screen.getByText("105")).toBeInTheDocument()
    await screen.findByRole("table", { name: "Decided" })
    expect(await axeViolations(container)).toEqual([])

    await user.keyboard("a")
    await user.keyboard("{Enter}")

    expect(
      await screen.findByText("kurir.budi@example.com is a courier now, and the fleet has activated the driver.")
    ).toBeInTheDocument()
  })

  it("asks before rejecting a courier, with Cancel ready, and rejects it by its principal", async () => {
    bff = fakeBff({
      ...courierRoutes,
      "POST /bff/api/v1/couriers/3c9e2a41-7b5d-4f08-9a1c-2d6e8f0b4c05/reject": () =>
        Response.json({
          ...courier(5, 63, "kurir.budi@example.com"),
          status: "rejected",
          rejectedAt: "2026-10-29T03:20:11.204Z"
        })
    })

    const user = userEvent.setup()
    show("/approvals/couriers")
    await screen.findByRole("heading", { level: 2, name: "kurir.budi@example.com" })

    await user.keyboard("r")
    const dialog = await screen.findByRole("alertdialog", { name: "Reject kurir.budi@example.com?" })
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus()
    expect(within(dialog).getByText(/the fleet is not asked/)).toBeInTheDocument()

    await user.click(within(dialog).getByRole("button", { name: "Reject" }))

    expect(await screen.findByText("The application of kurir.budi@example.com is rejected.")).toBeInTheDocument()
    expect(await screen.findByRole("heading", { level: 2, name: "kurir.sari@example.com" })).toBeInTheDocument()
    expect(asked("POST /bff/api/v1/couriers/3c9e2a41-7b5d-4f08-9a1c-2d6e8f0b4c05/reject")).toBe(1)
  })

  it("lists rejected couriers with when they were rejected and offers no decision", async () => {
    bff = fakeBff({
      ...courierRoutes,
      "GET /bff/api/v1/couriers/applications": () =>
        Response.json({
          applications: [{ ...couriers[0], status: "rejected", rejectedAt: "2026-10-29T03:20:11.204Z" }],
          nextAfterId: null
        })
    })

    show("/approvals/couriers?status=rejected")
    await screen.findByRole("heading", { level: 2, name: "kurir.budi@example.com" })

    expect(screen.getByText(/The courier may register again from the courier app/)).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Approve" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Reject" })).toBeNull()

    const listed = bff.seen.find((request) => request.route === "GET /bff/api/v1/couriers/applications")
    expect(listed).toBeDefined()
  })

  it("explains a courier who is approved but whose driver the fleet was not told about", async () => {
    bff = fakeBff({
      ...courierRoutes,
      "POST /bff/api/v1/couriers/3c9e2a41-7b5d-4f08-9a1c-2d6e8f0b4c05/approve": () =>
        Response.json(
          {
            error: "FLEET_UNAVAILABLE",
            message: "The account is now a courier, but the fleet could not be told to activate the driver.",
            traceId: "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b"
          },
          { status: 503 }
        )
    })

    const user = userEvent.setup()
    show("/approvals/couriers")
    await screen.findByRole("heading", { level: 2, name: "kurir.budi@example.com" })

    await user.keyboard("a")
    await user.keyboard("{Enter}")

    expect(await screen.findByText(/Approve again once the fleet answers/)).toBeInTheDocument()
  })

  it("says why a courier without a vehicle cannot be approved", async () => {
    bff = fakeBff({
      ...courierRoutes,
      "POST /bff/api/v1/couriers/3c9e2a41-7b5d-4f08-9a1c-2d6e8f0b4c05/approve": () =>
        Response.json(
          {
            error: "NO_DRIVER_RECORD",
            message: "This account has filed no vehicle, so it cannot be approved as a courier.",
            traceId: "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b"
          },
          { status: 409 }
        )
    })

    const user = userEvent.setup()
    show("/approvals/couriers")
    await screen.findByRole("heading", { level: 2, name: "kurir.budi@example.com" })

    await user.keyboard("a")
    await user.keyboard("{Enter}")

    expect(await screen.findByText(/registers a vehicle in the courier app first/)).toBeInTheDocument()
  })
})
