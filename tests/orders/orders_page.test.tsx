import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  useNavigate
} from "@tanstack/react-router"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { startOfDay } from "../../src/features/orders/local_day"
import { OrdersPage } from "../../src/features/orders/OrdersPage"
import { ordersSearch, returnsSearch, sagasSearch } from "../../src/features/orders/orders_search"
import { inPlace } from "../../src/ui/in_place"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"
import {
  deliveredId,
  deliveredRow,
  type OrderRow,
  openReturn,
  orderDetail,
  paidRow,
  refusal,
  returnedId,
  returnedRow
} from "../support/order_answers"

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

type Route = (request: Request) => Response | Promise<Response>

const searchPath = "/bff/api/v1/orders/search"

const retried = "payment could not be asked to release the escrow; the release is retried until payment accepts it"

function page(orders: OrderRow[], nextCursor: string | null = null): Route {
  return () => Response.json({ orders, nextCursor })
}

function desk(search: Route, extra: Record<string, Route> = {}, returns: unknown[] = []) {
  return {
    [`GET ${searchPath}`]: search,
    "GET /bff/api/v1/orders/sagas/needs-attention/count": () => Response.json(2),
    "GET /bff/api/v1/orders/returns/needs-attention": () => Response.json(returns),
    ...extra
  }
}

function searches(): URLSearchParams[] {
  return bff.addresses
    .filter((request) => request.route === `GET ${searchPath}`)
    .map((request) => new URL(request.url).searchParams)
}

function show(path: string) {
  const root = createRootRoute()

  const orders = createRoute({
    getParentRoute: () => root,
    path: "/orders",
    validateSearch: ordersSearch,
    component: function OrdersRoute() {
      const navigate = useNavigate()

      return (
        <OrdersPage
          search={orders.useSearch()}
          onSearch={(next) => void navigate({ to: "/orders", search: next, ...inPlace })}
        />
      )
    }
  })

  const sagas = createRoute({
    getParentRoute: () => root,
    path: "/orders/sagas",
    validateSearch: sagasSearch,
    component: () => null
  })

  const returns = createRoute({
    getParentRoute: () => root,
    path: "/orders/returns",
    validateSearch: returnsSearch,
    component: () => null
  })

  const router = createRouter({
    routeTree: root.addChildren([orders, sagas, returns]),
    history: createMemoryHistory({ initialEntries: [path] })
  })

  const view = render(
    <AppProviders client={testQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>
  )

  return { router, ...view }
}

async function orderArticle(number: string) {
  return screen.findByRole("article", { name: new RegExp(number) }, { timeout: 3000 })
}

describe("the orders page", () => {
  it("asks for the newest orders, shows them as a table, and is accessible", async () => {
    bff = fakeBff(desk(page([deliveredRow, paidRow])))

    const { container } = show("/orders")
    const table = await screen.findByRole("table", { name: "Orders found, newest first" })
    const rows = within(table).getAllByRole("row")

    expect(rows).toHaveLength(3)
    expect(within(rows[1] as HTMLElement).getByRole("link", { name: "ORD-20261022-7F3A9C1B" })).toBeInTheDocument()
    expect(within(rows[1] as HTMLElement).getByText("Delivered")).toBeInTheDocument()
    expect(within(rows[2] as HTMLElement).getByText("Paid")).toBeInTheDocument()

    const [first] = searches()
    expect(first?.get("limit")).toBe("50")
    expect([...(first?.keys() ?? [])]).toEqual(["limit"])

    const screens = screen.getByRole("navigation", { name: "Order screens" })
    await waitFor(() => expect(within(screens).getByText("2")).toBeInTheDocument())
    expect(screen.getByRole("list", { name: "Keys on this page" })).toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("sends every filter as order's parameters, keeps them in the address and reads them back", async () => {
    bff = fakeBff(desk(page([deliveredRow])))

    const user = userEvent.setup()
    const { router, unmount } = show("/orders")
    await screen.findByRole("table")

    await user.click(screen.getByRole("button", { name: "Delivered" }))
    await user.click(screen.getByRole("button", { name: "Paid" }))
    fireEvent.change(screen.getByLabelText("Placed from"), { target: { value: "2026-11-01" } })
    fireEvent.change(screen.getByLabelText("Placed until"), { target: { value: "2026-11-10" } })
    await user.type(screen.getByLabelText("Seller principal"), " a3d5f7b9-2c4e-4a6b-8d0f-1e3a5c7b9d21 ")
    await user.type(screen.getByLabelText("Buyer principal"), "4c2e8a71-5b3d-4f6e-9a1c-7d8e2f3b4a50")
    await user.type(screen.getByLabelText("Order number"), "ord-20261022-7f3a9c1b")
    await user.click(screen.getByRole("button", { name: "Search" }))

    const wanted = {
      status: "PAID,DELIVERED",
      from: "2026-11-01",
      to: "2026-11-10",
      merchant: "a3d5f7b9-2c4e-4a6b-8d0f-1e3a5c7b9d21",
      customer: "4c2e8a71-5b3d-4f6e-9a1c-7d8e2f3b4a50",
      orderNumber: "ORD-20261022-7F3A9C1B"
    }

    await waitFor(() => expect(router.state.location.search).toMatchObject(wanted))

    const sent = searches().at(-1)
    expect(sent?.get("status")).toBe("PAID,DELIVERED")
    expect(sent?.get("createdFrom")).toBe(startOfDay("2026-11-01", 0))
    expect(sent?.get("createdTo")).toBe(startOfDay("2026-11-11", 0))
    expect(sent?.get("merchant")).toBe(wanted.merchant)
    expect(sent?.get("customer")).toBe(wanted.customer)
    expect(sent?.get("orderNumber")).toBe(wanted.orderNumber)
    expect(sent?.has("before")).toBe(false)

    const address = router.state.location.href
    unmount()
    const again = show(address)

    expect(await screen.findByRole("table")).toBeInTheDocument()
    expect(screen.getByLabelText("Placed from")).toHaveValue("2026-11-01")
    expect(screen.getByLabelText("Order number")).toHaveValue("ORD-20261022-7F3A9C1B")
    expect(screen.getByRole("button", { name: "Paid" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "Cancelled" })).toHaveAttribute("aria-pressed", "false")
    await waitFor(() => expect(again.router.state.location.search).toMatchObject({ order: deliveredId }))
  })

  it("refuses a first day after the last, and a principal that is not a UUID, before asking order", async () => {
    bff = fakeBff(desk(page([deliveredRow])))

    const user = userEvent.setup()
    show("/orders")
    await screen.findByRole("table")
    const asked = searches().length

    fireEvent.change(screen.getByLabelText("Placed from"), { target: { value: "2026-11-10" } })
    fireEvent.change(screen.getByLabelText("Placed until"), { target: { value: "2026-11-01" } })
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(await screen.findByText("The first day comes after the last.")).toBeInTheDocument()
    expect(searches()).toHaveLength(asked)

    fireEvent.change(screen.getByLabelText("Placed until"), { target: { value: "" } })
    await user.type(screen.getByLabelText("Buyer principal"), "buyer-17")
    await user.click(screen.getByRole("button", { name: "Search" }))

    expect(await screen.findByText(/A principal id is a UUID of 36 characters/)).toBeInTheDocument()
    expect(screen.queryByText("The first day comes after the last.")).toBeNull()
    expect(searches()).toHaveLength(asked)
  })

  it("pages to older orders with the cursor in the address, and back to the newest", async () => {
    bff = fakeBff(
      desk((request) => {
        const before = new URL(request.url).searchParams.get("before")

        return before === null
          ? Response.json({ orders: [deliveredRow], nextCursor: "eyJhdCI6MX0" })
          : Response.json({ orders: [paidRow], nextCursor: null })
      })
    )

    const user = userEvent.setup()
    const { router } = show("/orders?status=DELIVERED")
    await screen.findByRole("link", { name: "ORD-20261022-7F3A9C1B" })

    await user.click(screen.getByRole("button", { name: "Older" }))
    await waitFor(() => expect(router.state.location.search).toEqual({ status: "DELIVERED", before: "eyJhdCI6MX0" }))
    expect(await screen.findByRole("link", { name: "ORD-20261021-2B4D6F80" })).toBeInTheDocument()
    expect(searches().at(-1)?.get("before")).toBe("eyJhdCI6MX0")
    expect(searches().at(-1)?.get("status")).toBe("DELIVERED")
    expect(screen.queryByRole("button", { name: "Older" })).toBeNull()

    await user.click(screen.getByRole("button", { name: "Newest" }))
    await waitFor(() => expect(router.state.location.search).toEqual({ status: "DELIVERED" }))
  })

  it("says in words why order refused the filters", async () => {
    bff = fakeBff(
      desk(() =>
        refusal(400, "INVALID_CREATED_RANGE", "createdFrom must not be after createdTo; the range is [from, to)")
      )
    )

    show("/orders?from=2026-11-10&to=2026-11-01")

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Order refused the days: the first day must not come after the last.")
    expect(within(alert).getByText(/createdFrom must not be after createdTo/)).toHaveAttribute("lang", "en")
    expect(screen.queryByRole("table")).toBeNull()
    expect(within(alert).getByRole("button", { name: "Clear filters" })).toBeInTheDocument()
  })

  it("offers the newest page when order cannot read a cursor", async () => {
    bff = fakeBff(
      desk((request) =>
        new URL(request.url).searchParams.has("before")
          ? refusal(400, "INVALID_CURSOR", "before is not a cursor this endpoint wrote")
          : Response.json({ orders: [deliveredRow], nextCursor: null })
      )
    )

    const user = userEvent.setup()
    const { router } = show("/orders?before=stale")

    expect(await screen.findByRole("alert")).toHaveTextContent("This page of results can no longer be read.")
    await user.click(screen.getByRole("button", { name: "Newest" }))
    await waitFor(() => expect(router.state.location.search).toEqual({}))
    expect(await screen.findByRole("table")).toBeInTheDocument()
  })

  it("reads an order: items, totals, shipping, its timeline and its return", async () => {
    bff = fakeBff(
      desk(
        page([returnedRow]),
        { [`GET /bff/api/v1/orders/${returnedId}`]: () => Response.json(orderDetail(returnedRow)) },
        [openReturn]
      )
    )

    const { container } = show(`/orders?order=${returnedId}`)
    const article = await orderArticle("ORD-20261015-2C9E7A41")

    expect(within(article).getByText("Kopi Arabika Gayo 250 g")).toBeInTheDocument()
    expect(within(article).getByText("KOPI-ARABIKA-250")).toBeInTheDocument()
    expect(within(article).getByText("Discount, voucher HEMAT10")).toBeInTheDocument()
    expect(within(article).getByText("Jl. Contoh Raya No. 12, Menteng, Jakarta Pusat 10310")).toBeInTheDocument()
    expect(within(article).getByText("By matching, for the route and the parcel's weight")).toBeInTheDocument()

    const timeline = within(article).getByRole("region", { name: "Timeline" })
    expect(within(timeline).getByText("Delivered").closest("li")).toHaveAttribute("data-reached", "true")
    expect(within(timeline).getByText("Completed").closest("li")).toHaveAttribute("data-reached", "false")

    const returned = within(article).getByRole("region", { name: "Return" })
    expect(within(returned).getByText("RMA-20261019-4B8D2E6A")).toBeInTheDocument()
    expect(within(returned).getByRole("link", { name: "Open return RMA-20261019-4B8D2E6A" })).toHaveAttribute(
      "href",
      "/orders/returns?selected=RMA-20261019-4B8D2E6A"
    )

    expect(
      within(article).getByText(
        "Return RMA-20261019-4B8D2E6A against this order is not resolved, so it cannot be completed yet."
      )
    ).toBeInTheDocument()

    expect(within(article).queryByRole("button", { name: "Complete early" })).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it("completes a delivered order with C once confirmed, and says where the escrow went", async () => {
    bff = fakeBff(
      desk(page([deliveredRow]), {
        [`GET /bff/api/v1/orders/${deliveredId}`]: () => Response.json(orderDetail(deliveredRow)),
        "POST /bff/api/v1/orders/ORD-20261022-7F3A9C1B/complete": () =>
          Response.json({ orderNumber: "ORD-20261022-7F3A9C1B", escrowReleased: false, detail: retried })
      })
    )

    const user = userEvent.setup()
    show(`/orders?order=${deliveredId}`)
    const article = await orderArticle("ORD-20261022-7F3A9C1B")
    expect(await within(article).findByRole("button", { name: "Complete early" })).toBeInTheDocument()
    const asked = searches().length

    await user.keyboard("c")
    const dialog = await screen.findByRole("alertdialog", { name: "Complete ORD-20261022-7F3A9C1B now?" })
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Keep it open" })).toHaveFocus())
    await user.click(within(dialog).getByRole("button", { name: "Complete the order" }))

    expect(
      await screen.findByText(
        "ORD-20261022-7F3A9C1B is completed. Payment could not be reached to release the escrow; order keeps asking until payment accepts."
      )
    ).toBeInTheDocument()

    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    expect(within(article).getByText("This order is completed.")).toBeInTheDocument()
    expect(bff.seen.find((request) => request.route.endsWith("/complete"))?.body).toBeNull()
    await waitFor(() => expect(searches().length).toBeGreaterThan(asked))
  })

  it("keeps order's refusal in the dialog, in words, and reads the order again", async () => {
    let reads = 0
    bff = fakeBff(
      desk(page([deliveredRow]), {
        [`GET /bff/api/v1/orders/${deliveredId}`]: () => {
          reads += 1

          return Response.json(orderDetail(deliveredRow))
        },
        "POST /bff/api/v1/orders/ORD-20261022-7F3A9C1B/complete": () =>
          refusal(
            409,
            "RETURN_UNRESOLVED",
            "a return against this order is not resolved, so the buyer may still be owed a refund"
          )
      })
    )

    const user = userEvent.setup()
    show(`/orders?order=${deliveredId}`)
    const article = await orderArticle("ORD-20261022-7F3A9C1B")

    await user.click(await within(article).findByRole("button", { name: "Complete early" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Complete the order" }))

    const alert = await within(dialog).findByRole("alert")
    expect(alert).toHaveTextContent("A return against this order is not resolved")
    expect(within(alert).getByText(/the buyer may still be owed a refund/, { selector: "q" })).toHaveAttribute(
      "lang",
      "en"
    )

    await waitFor(() => expect(reads).toBe(2))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  it("sends a completion again after an unknown outcome, and reads already completed as done", async () => {
    let attempts = 0
    bff = fakeBff(
      desk(page([deliveredRow]), {
        [`GET /bff/api/v1/orders/${deliveredId}`]: () => Response.json(orderDetail(deliveredRow)),
        "POST /bff/api/v1/orders/ORD-20261022-7F3A9C1B/complete": () => {
          attempts += 1

          return attempts === 1
            ? Response.json(
                {
                  error: "DATABASE_UNAVAILABLE",
                  message:
                    "order could not reach its database, so whether any of this request took effect is not known here."
                },
                { status: 503 }
              )
            : refusal(409, "ORDER_ALREADY_COMPLETED", "the order is already complete")
        }
      })
    )

    const user = userEvent.setup()
    show(`/orders?order=${deliveredId}`)
    const article = await orderArticle("ORD-20261022-7F3A9C1B")

    await user.click(await within(article).findByRole("button", { name: "Complete early" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Complete the order" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Whether the order was completed is not known.")
    await user.click(within(dialog).getByRole("button", { name: "Send it again" }))

    expect(await within(dialog).findByText(/the attempt whose answer was lost went through/)).toBeInTheDocument()
    expect(attempts).toBe(2)
  })

  it("does not offer completion for an order that is not delivered", async () => {
    bff = fakeBff(
      desk(page([paidRow]), {
        [`GET /bff/api/v1/orders/${paidRow.id}`]: () => Response.json(orderDetail(paidRow))
      })
    )

    show(`/orders?order=${paidRow.id}`)
    const article = await orderArticle("ORD-20261021-2B4D6F80")

    expect(within(article).getByText("Only a delivered order can be completed early.")).toBeInTheDocument()
    expect(within(article).queryByRole("button", { name: "Complete early" })).toBeNull()
  })

  it("opens the one order an order number finds, and moves with J and K", async () => {
    bff = fakeBff(
      desk(
        (request) =>
          new URL(request.url).searchParams.has("orderNumber")
            ? Response.json({ orders: [deliveredRow], nextCursor: null })
            : Response.json({ orders: [deliveredRow, paidRow], nextCursor: null }),
        {
          [`GET /bff/api/v1/orders/${deliveredId}`]: () => Response.json(orderDetail(deliveredRow)),
          [`GET /bff/api/v1/orders/${paidRow.id}`]: () => Response.json(orderDetail(paidRow))
        }
      )
    )

    const user = userEvent.setup()
    const { router, unmount } = show("/orders?orderNumber=ORD-20261022-7F3A9C1B")

    await waitFor(() =>
      expect(router.state.location.search).toEqual({ orderNumber: "ORD-20261022-7F3A9C1B", order: deliveredId })
    )

    expect(await orderArticle("ORD-20261022-7F3A9C1B")).toBeInTheDocument()
    unmount()

    const board = show("/orders")
    await screen.findByRole("table")
    await user.keyboard("j")
    await waitFor(() => expect(board.router.state.location.search).toEqual({ order: deliveredId }))
    await user.keyboard("j")
    await waitFor(() => expect(board.router.state.location.search).toEqual({ order: paidRow.id }))
    expect(screen.getByRole("link", { name: "ORD-20261021-2B4D6F80" })).toHaveAttribute("aria-current", "page")
    await user.keyboard("k")
    await waitFor(() => expect(board.router.state.location.search).toEqual({ order: deliveredId }))
  })

  it("takes J, K and C from the page with focus on an order's link", async () => {
    bff = fakeBff(
      desk(page([deliveredRow, paidRow]), {
        [`GET /bff/api/v1/orders/${deliveredId}`]: () => Response.json(orderDetail(deliveredRow)),
        [`GET /bff/api/v1/orders/${paidRow.id}`]: () => Response.json(orderDetail(paidRow))
      })
    )

    const user = userEvent.setup()
    const { router } = show("/orders")

    await user.click(await screen.findByRole("link", { name: "ORD-20261021-2B4D6F80" }))
    await waitFor(() => expect(router.state.location.search).toEqual({ order: paidRow.id }))
    expect(screen.getByRole("link", { name: "ORD-20261021-2B4D6F80" })).toHaveFocus()

    await user.keyboard("k")
    await waitFor(() => expect(router.state.location.search).toEqual({ order: deliveredId }))
    await within(await orderArticle("ORD-20261022-7F3A9C1B")).findByRole("button", { name: "Complete early" })
    await user.keyboard("c")
    expect(await screen.findByRole("alertdialog", { name: "Complete ORD-20261022-7F3A9C1B now?" })).toBeInTheDocument()
  })

  it("says so when order has no order with the id", async () => {
    bff = fakeBff(
      desk(page([]), {
        [`GET /bff/api/v1/orders/${deliveredId}`]: () =>
          refusal(404, "ORDER_NOT_FOUND", `Order '${deliveredId}' not found`)
      })
    )

    show(`/orders?order=${deliveredId}`)

    expect(await screen.findByText("Order has no order with this id.", {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText("No order matches these filters.")).toBeInTheDocument()
  })
})
