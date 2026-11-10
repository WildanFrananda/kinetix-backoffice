import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ordersSearch, returnsSearch, sagasSearch } from "../../src/features/orders/orders_search"
import { ReturnsPage } from "../../src/features/orders/ReturnsPage"
import { inPlace } from "../../src/ui/in_place"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"
import { openReturn, refusal, stuckReturn } from "../support/order_answers"

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

const listPath = "/bff/api/v1/orders/returns/needs-attention"

const rejectPath = `/bff/api/v1/orders/returns/${openReturn.returnNumber}/reject`

const secondOpen = {
  ...openReturn,
  returnNumber: "RMA-20261021-7C3E5A1B",
  orderNumber: "ORD-20261018-4A6C8E02",
  openedAt: "2026-10-21T10:00:00Z"
}

function desk(list: Route, extra: Record<string, Route> = {}) {
  return {
    [`GET ${listPath}`]: list,
    "GET /bff/api/v1/orders/sagas/needs-attention/count": () => Response.json(0),
    ...extra
  }
}

function lists(): number {
  return bff.seen.filter((request) => request.route === `GET ${listPath}`).length
}

function show(path: string) {
  const root = createRootRoute()

  const returns = createRoute({
    getParentRoute: () => root,
    path: "/orders/returns",
    validateSearch: returnsSearch,
    component: function ReturnsRoute() {
      const navigate = returns.useNavigate()

      return (
        <ReturnsPage search={returns.useSearch()} onSearch={(next) => void navigate({ search: next, ...inPlace })} />
      )
    }
  })

  const orders = createRoute({
    getParentRoute: () => root,
    path: "/orders",
    validateSearch: ordersSearch,
    component: () => null
  })

  const sagas = createRoute({
    getParentRoute: () => root,
    path: "/orders/sagas",
    validateSearch: sagasSearch,
    component: () => null
  })

  const router = createRouter({
    routeTree: root.addChildren([returns, orders, sagas]),
    history: createMemoryHistory({ initialEntries: [path] })
  })

  const view = render(
    <AppProviders client={testQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>
  )

  return { router, ...view }
}

describe("the returns needing attention", () => {
  it("lists them oldest first, as order answers, and is accessible", async () => {
    bff = fakeBff(desk(() => Response.json([openReturn, stuckReturn])))

    const { container } = show("/orders/returns")
    const list = await screen.findByRole("listbox", { name: "Returns" })

    expect(
      within(list)
        .getAllByRole("option")
        .map((option) => option.textContent?.slice(0, 21))
    ).toEqual(["RMA-20261019-4B8D2E6A", "RMA-20261020-9A1C3E5F"])

    const asked = bff.addresses.find((request) => request.route === `GET ${listPath}`)
    expect(new URL(asked?.url ?? "https://backoffice.test/").searchParams.get("limit")).toBe("200")
    expect(await axeViolations(container)).toEqual([])
  })

  it("rejects an open return with R, even from the list, and a reason, then moves to the next", async () => {
    let current = [openReturn, secondOpen]
    bff = fakeBff(
      desk(() => Response.json(current), {
        [`POST ${rejectPath}`]: () => {
          current = [secondOpen]

          return new Response(null, { status: 204 })
        }
      })
    )

    const user = userEvent.setup()
    const { router, container } = show(`/orders/returns?selected=${openReturn.returnNumber}`)
    const article = await screen.findByRole("article", { name: /RMA-20261019-4B8D2E6A/ })
    expect(within(article).getByRole("link", { name: "ORD-20261015-2C9E7A41" })).toHaveAttribute(
      "href",
      "/orders?orderNumber=ORD-20261015-2C9E7A41"
    )

    await user.click(screen.getByRole("option", { name: /RMA-20261019-4B8D2E6A/ }))
    expect(screen.getByRole("option", { name: /RMA-20261019-4B8D2E6A/ })).toHaveFocus()
    await user.keyboard("r")
    const dialog = await screen.findByRole("alertdialog", { name: "Reject RMA-20261019-4B8D2E6A?" })
    const reason = within(dialog).getByRole("textbox", { name: "Reason" })
    await waitFor(() => expect(reason).toHaveFocus())

    await user.type(reason, "   ")
    await user.click(within(dialog).getByRole("button", { name: "Reject the return" }))
    expect(await within(dialog).findByText("Say why the return is rejected.")).toBeInTheDocument()
    expect(bff.seen.filter((request) => request.route === `POST ${rejectPath}`)).toHaveLength(0)
    expect(await axeViolations(container)).toEqual([])

    await user.type(reason, " Foto dari pembeli menunjukkan segel kemasan masih utuh ")
    await user.click(within(dialog).getByRole("button", { name: "Reject the return" }))

    expect(
      await screen.findByText(
        "RMA-20261019-4B8D2E6A is rejected. Order ORD-20261015-2C9E7A41 completes when its return window closes."
      )
    ).toBeInTheDocument()

    expect(bff.seen.find((request) => request.route === `POST ${rejectPath}`)?.body).toEqual({
      reason: "Foto dari pembeli menunjukkan segel kemasan masih utuh"
    })

    await waitFor(() => expect(router.state.location.search).toEqual({ selected: secondOpen.returnNumber }))
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1))
    expect(screen.getByRole("link", { name: "Find ORD-20261015-2C9E7A41 to complete it early" })).toBeInTheDocument()
  })

  it("keeps a 409 in the dialog in order's words and reads the list again", async () => {
    bff = fakeBff(
      desk(() => Response.json([openReturn]), {
        [`POST ${rejectPath}`]: () =>
          refusal(
            409,
            "GOODS_ALREADY_RECEIVED",
            "the goods came back, so the buyer is owed a refund and the return cannot be rejected"
          )
      })
    )

    const user = userEvent.setup()
    show(`/orders/returns?selected=${openReturn.returnNumber}`)
    const article = await screen.findByRole("article", { name: /RMA-20261019-4B8D2E6A/ })

    await user.click(within(article).getByRole("button", { name: "Reject return" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Reason" }), "Segel utuh")
    const before = lists()
    await user.click(within(dialog).getByRole("button", { name: "Reject the return" }))

    const alert = await within(dialog).findByRole("alert")
    expect(alert).toHaveTextContent("The goods came back, so the buyer is owed a refund")
    expect(within(alert).getByText(/the return cannot be rejected/, { selector: "q" })).toHaveAttribute("lang", "en")
    await waitFor(() => expect(lists()).toBeGreaterThan(before))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  it("says another admin decided first on a 404, keeps the words in the dialog, and the list read again drops it", async () => {
    let current = [openReturn]
    bff = fakeBff(
      desk(() => Response.json(current), {
        [`POST ${rejectPath}`]: () => {
          current = []

          return refusal(404, "RETURN_NOT_FOUND", "no return carries that number")
        }
      })
    )

    const user = userEvent.setup()
    show(`/orders/returns?selected=${openReturn.returnNumber}`)
    const article = await screen.findByRole("article", { name: /RMA-20261019-4B8D2E6A/ })

    await user.click(within(article).getByRole("button", { name: "Reject return" }))
    const dialog = await screen.findByRole("alertdialog")
    await user.type(within(dialog).getByRole("textbox", { name: "Reason" }), "Segel utuh")
    await user.click(within(dialog).getByRole("button", { name: "Reject the return" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Order has no return with this number.")
    expect(await screen.findByText("No return needs attention.")).toBeInTheDocument()
    expect(within(screen.getByRole("alertdialog")).getByRole("alert")).toHaveTextContent(
      "Order has no return with this number."
    )

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    expect(within(article).getByText(/No longer among the returns needing attention/)).toBeInTheDocument()
    expect(within(article).queryByRole("button", { name: "Reject return" })).toBeNull()
  })

  it("offers no rejection for a return whose goods came back, and shows why the refund stopped", async () => {
    bff = fakeBff(desk(() => Response.json([openReturn, stuckReturn])))

    show(`/orders/returns?selected=${stuckReturn.returnNumber}`)
    const article = await screen.findByRole("article", { name: /RMA-20261020-9A1C3E5F/ })

    expect(within(article).queryByRole("button", { name: "Reject return" })).toBeNull()
    expect(within(article).getByText("payment held nothing to refund goods from")).toHaveAttribute("lang", "en")
    expect(within(article).getByText(/the buyer is owed .*85.000|the buyer is owed .*85,000/)).toBeInTheDocument()
  })
})
