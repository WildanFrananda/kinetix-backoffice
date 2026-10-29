import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { StockPage } from "../../src/features/stock/StockPage"
import { stockSearch } from "../../src/features/stock/stock_search"
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

const owner = "3f6c1a2e-8b4d-4e7f-9a1c-5d2e7b8f0a14"

const staff = "9b2e4c71-5a3d-4f86-b0e2-7c1d8a6f3e59"

function bin(code: string, zone: string, level: number, skus: number, units: number) {
  return {
    id: code.length * 7 + level,
    bin_code: code,
    zone,
    shelf_level: level,
    sku_count: skus,
    quantity: units,
    reserved_quantity: 0,
    updated_at: "2026-10-22T03:12:40.118Z"
  }
}

function row(id: number, code: string, sku: string, quantity: number, reserved: number) {
  return {
    id,
    bin_code: code,
    zone: code.slice(0, 1),
    shelf_level: 3,
    sku,
    merchant_principal_id: owner,
    quantity,
    reserved_quantity: reserved,
    available_quantity: Math.max(0, quantity - reserved),
    updated_at: "2026-10-22T03:12:40.118Z"
  }
}

const bins = [bin("A-01-3", "A", 3, 2, 36), bin("A-01-4", "A", 4, 0, 0), bin("B-02-1", "B", 1, 1, 12)]

function query(request: Request): URLSearchParams {
  return new URL(request.url).searchParams
}

function floor(extra: Record<string, (request: Request) => Response | Promise<Response>> = {}) {
  return {
    "GET /bff/api/v1/warehouse/bins": () => Response.json({ bins, next_after: null }),
    "GET /bff/api/v1/warehouse/bins/stock": (request: Request) => {
      const wanted = query(request)
      const rows = [row(204, "A-01-3", "GAMIS-RED-M", 24, 4), row(205, "A-01-3", "KERUDUNG-01", 12, 0)]

      return Response.json({
        stock: rows.filter(
          (candidate) =>
            (wanted.get("bin_code") ?? candidate.bin_code) === candidate.bin_code &&
            (wanted.get("sku") ?? candidate.sku) === candidate.sku
        ),
        next_after_id: null
      })
    },
    "GET /bff/api/v1/warehouse/stock_receipts": () =>
      Response.json({
        receipts: [
          {
            id: 912,
            bin_code: "A-01-3",
            sku: "GAMIS-RED-M",
            merchant_principal_id: owner,
            quantity: 24,
            note: "Inbound delivery, carton 2 of 3",
            received_by_principal_id: staff,
            created_at: "2026-10-22T03:12:40.104Z"
          }
        ],
        next_before_id: null
      }),
    "GET /bff/api/v1/warehouse/stock_adjustments": () => Response.json({ adjustments: [], next_before_id: null }),
    ...extra
  }
}

function show(path: string) {
  const root = createRootRoute()

  const page = createRoute({
    getParentRoute: () => root,
    path: "/warehouse/stock",
    validateSearch: stockSearch,
    component: function StockRoute() {
      const navigate = page.useNavigate()

      return <StockPage search={page.useSearch()} onSearch={(next) => void navigate({ search: next, ...inPlace })} />
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

describe("stock", () => {
  it("lists the bins with their totals, and is accessible", async () => {
    bff = fakeBff(floor())

    const { container } = show("/warehouse/stock")

    expect(await screen.findByRole("option", { name: "A-01-3" })).toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(3)
    expect(within(screen.getByRole("option", { name: "A-01-3" })).getByText("2 SKUs · 36 units")).toBeInTheDocument()
    expect(within(screen.getByRole("option", { name: "A-01-4" })).getByText("Empty")).toBeInTheDocument()
    expect(screen.getByText("Nothing chosen")).toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("shows a bin's shelf and its ledger, and keeps the choice in the address", async () => {
    bff = fakeBff(floor())

    const user = userEvent.setup()
    const { router, container } = show("/warehouse/stock")
    await user.click(await screen.findByRole("option", { name: "A-01-3" }))

    expect(await screen.findByRole("heading", { level: 2, name: "A-01-3" })).toBeInTheDocument()
    expect(router.state.location.search).toEqual({ bin: "A-01-3" })

    const shelf = await screen.findByRole("table")
    expect(within(shelf).getByRole("rowheader", { name: "GAMIS-RED-M" })).toBeInTheDocument()
    expect(within(within(shelf).getByRole("row", { name: /GAMIS-RED-M/ })).getAllByRole("cell")[3]).toHaveTextContent(
      "20"
    )

    expect(await screen.findByText("+24 of GAMIS-RED-M")).toBeInTheDocument()
    expect(screen.getByText("No adjustment yet.")).toBeInTheDocument()

    const stockAsked = bff.seen.find((request) => request.route === "GET /bff/api/v1/warehouse/bins/stock")
    expect(stockAsked).toBeDefined()
    expect(await axeViolations(container)).toEqual([])
  })

  it("books a delivery for the merchant catalog names, with a key kept for the request", async () => {
    bff = fakeBff(
      floor({
        "GET /bff/api/v1/products/GAMIS-RED-M": () =>
          Response.json({ sku: "GAMIS-RED-M", title: "Gamis Merah M", merchant_principal_id: owner }),
        "POST /bff/api/v1/warehouse/stock_receipts": () =>
          Response.json(
            { id: 2214, sku: "GAMIS-RED-M", quantity: 6, bin_code: "A-01-3", quantity_on_hand: 30, replayed: false },
            { status: 201 }
          )
      })
    )

    const user = userEvent.setup()
    show("/warehouse/stock?bin=A-01-3")
    await user.click(await screen.findByRole("button", { name: "Book goods in" }))

    const dialog = await screen.findByRole("dialog", { name: "Book goods into A-01-3" })
    await user.type(within(dialog).getByRole("textbox", { name: "SKU" }), "GAMIS-RED-M")
    await user.click(within(dialog).getByRole("button", { name: "Look up" }))
    expect(await within(dialog).findByText("Gamis Merah M, sold by 3f6c1a2e…")).toBeInTheDocument()

    await user.type(within(dialog).getByRole("textbox", { name: "Units counted" }), "6")
    await user.click(within(dialog).getByRole("button", { name: "Book in" }))

    expect(await screen.findByText("Booked 6 of GAMIS-RED-M into A-01-3: 30 on hand.")).toBeInTheDocument()

    const booked = bff.seen.find((request) => request.route === "POST /bff/api/v1/warehouse/stock_receipts")
    expect(booked?.body).toMatchObject({
      bin_code: "A-01-3",
      sku: "GAMIS-RED-M",
      quantity: 6,
      merchant_principal_id: owner
    })

    expect((booked?.body as { idempotency_key?: string } | undefined)?.idempotency_key).toMatch(/^[0-9a-f-]{36}$/)
    expect(booked?.body).not.toHaveProperty("note")
  })

  it("refuses a product catalog does not sell before asking warehouse", async () => {
    bff = fakeBff(
      floor({
        "GET /bff/api/v1/products/NOPE": () =>
          Response.json({ error: "PRODUCT_NOT_FOUND", message: "no product with this SKU is on sale" }, { status: 404 })
      })
    )

    const user = userEvent.setup()
    show("/warehouse/stock?bin=A-01-3")
    await user.click(await screen.findByRole("button", { name: "Book goods in" }))

    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox", { name: "SKU" }), "NOPE")
    await user.click(within(dialog).getByRole("button", { name: "Look up" }))

    expect(await within(dialog).findByText("No product with this SKU is on sale.")).toBeInTheDocument()
    expect(within(dialog).getByRole("button", { name: "Book in" })).toBeDisabled()
  })

  it("adjusts within what is free, and explains warehouse's limit when the reserve moved first", async () => {
    let attempts = 0
    bff = fakeBff(
      floor({
        "POST /bff/api/v1/warehouse/stock_adjustments": () => {
          attempts += 1

          return Response.json(
            {
              error: "that would cut into stock already reserved for orders",
              quantity_on_hand: 24,
              reserved_quantity: 9,
              max_reduction: 15
            },
            { status: 409 }
          )
        }
      })
    )

    const user = userEvent.setup()
    show("/warehouse/stock?bin=A-01-3")
    await user.click(await screen.findByRole("button", { name: "Adjust GAMIS-RED-M" }))

    const dialog = await screen.findByRole("dialog", { name: "Adjust GAMIS-RED-M in A-01-3" })
    expect(within(dialog).getByText("24 on hand, 4 held for orders: at most 20 can be taken away.")).toBeInTheDocument()

    await user.type(within(dialog).getByRole("textbox", { name: "Units" }), "21")
    await user.click(within(dialog).getByRole("button", { name: "Adjust" }))
    expect(await within(dialog).findByText("At most 20 can be taken away now.")).toBeInTheDocument()
    expect(attempts).toBe(0)

    await user.clear(within(dialog).getByRole("textbox", { name: "Units" }))
    await user.type(within(dialog).getByRole("textbox", { name: "Units" }), "18")
    await user.click(within(dialog).getByRole("radio", { name: "Missing" }))
    await user.click(within(dialog).getByRole("button", { name: "Adjust" }))

    expect(
      await within(dialog).findByText("That would cut into units held for orders. At most 15 can be taken away now.")
    ).toBeInTheDocument()

    expect(
      bff.seen.find((request) => request.route === "POST /bff/api/v1/warehouse/stock_adjustments")?.body
    ).toMatchObject({ quantity_delta: -18, reason: "SHRINKAGE", sku: "GAMIS-RED-M", merchant_principal_id: owner })
  })

  it("finds where a SKU is kept and opens that bin", async () => {
    bff = fakeBff(floor())

    const user = userEvent.setup()
    const { router } = show("/warehouse/stock")
    await screen.findByRole("option", { name: "A-01-3" })

    await user.type(screen.getByRole("textbox", { name: "Find a SKU" }), "KERUDUNG-01")
    await user.click(screen.getByRole("button", { name: "Find" }))

    const found = await screen.findByRole("region", { name: "Where KERUDUNG-01 is kept" })
    await user.click(within(found).getByRole("button", { name: /A-01-3/ }))

    await waitFor(() => expect(router.state.location.search).toEqual({ sku: "KERUDUNG-01", bin: "A-01-3" }))
    expect(await screen.findByRole("heading", { level: 2, name: "A-01-3" })).toBeInTheDocument()
  })

  it("creates a bin and opens it", async () => {
    bff = fakeBff(
      floor({
        "POST /bff/api/v1/warehouse/bins": () =>
          Response.json({ id: 90, bin_code: "C-01-2", zone: "C", shelf_level: 2 }, { status: 201 })
      })
    )

    const user = userEvent.setup()
    const { router } = show("/warehouse/stock")
    await user.click(await screen.findByRole("button", { name: "New bin" }))

    const dialog = await screen.findByRole("dialog", { name: "New bin" })
    await user.type(within(dialog).getByRole("textbox", { name: "Bin code" }), "C-01-2")
    await user.type(within(dialog).getByRole("textbox", { name: "Zone" }), "C")
    await user.clear(within(dialog).getByRole("textbox", { name: "Shelf level" }))
    await user.type(within(dialog).getByRole("textbox", { name: "Shelf level" }), "2")
    await user.click(within(dialog).getByRole("button", { name: "Save bin" }))

    expect(await screen.findByText("Saved bin C-01-2.")).toBeInTheDocument()
    expect(bff.seen.find((request) => request.route === "POST /bff/api/v1/warehouse/bins")?.body).toEqual({
      bin_code: "C-01-2",
      zone: "C",
      shelf_level: 2
    })

    expect(router.state.location.search).toEqual({ bin: "C-01-2" })
  })

  it("moves through the bins with J and K, books in with B and makes a bin with N", async () => {
    bff = fakeBff(floor())

    const user = userEvent.setup()
    const { router } = show("/warehouse/stock")
    await screen.findByRole("option", { name: "A-01-3" })
    expect(screen.getByRole("list", { name: "Keyboard shortcuts" })).toBeInTheDocument()

    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ bin: "A-01-3" }))
    await user.keyboard("k")
    await waitFor(() => expect(router.state.location.search).toEqual({ bin: "B-02-1" }))
    await user.keyboard("k")
    await waitFor(() => expect(router.state.location.search).toEqual({ bin: "A-01-4" }))

    await screen.findByRole("heading", { level: 2, name: "A-01-4" })
    await user.keyboard("b")
    expect(await screen.findByRole("dialog", { name: "Book goods into A-01-4" })).toBeInTheDocument()
    await user.keyboard("{Escape}")
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

    await user.keyboard("n")
    expect(await screen.findByRole("dialog", { name: "New bin" })).toBeInTheDocument()
  })
})
