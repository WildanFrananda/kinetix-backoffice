import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ordersSearch, returnsSearch, sagasSearch } from "../../src/features/orders/orders_search"
import { SagasPage } from "../../src/features/orders/SagasPage"
import { inPlace } from "../../src/ui/in_place"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"
import { abandonedSaga, flaggedSaga } from "../support/order_answers"

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

const listPath = "/bff/api/v1/orders/sagas/needs-attention"

function show(path: string) {
  const root = createRootRoute()

  const sagas = createRoute({
    getParentRoute: () => root,
    path: "/orders/sagas",
    validateSearch: sagasSearch,
    component: function SagasRoute() {
      const navigate = sagas.useNavigate()

      return <SagasPage search={sagas.useSearch()} onSearch={(next) => void navigate({ search: next, ...inPlace })} />
    }
  })

  const orders = createRoute({
    getParentRoute: () => root,
    path: "/orders",
    validateSearch: ordersSearch,
    component: () => null
  })

  const returns = createRoute({
    getParentRoute: () => root,
    path: "/orders/returns",
    validateSearch: returnsSearch,
    component: () => null
  })

  const router = createRouter({
    routeTree: root.addChildren([sagas, orders, returns]),
    history: createMemoryHistory({ initialEntries: [path] })
  })

  const view = render(
    <AppProviders client={testQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>
  )

  return { router, ...view }
}

function deferred() {
  const settle: { release: (response: Response) => void } = { release: noAnswer }
  const answer = new Promise<Response>((resolve) => {
    settle.release = resolve
  })

  return {
    answer,
    release(response: Response): void {
      settle.release(response)
    }
  }
}

function noAnswer(): void {
  return
}

function lists(): number {
  return bff.seen.filter((request) => request.route === `GET ${listPath}`).length
}

describe("the stuck checkouts", () => {
  it("lists the sagas, asks for 200 at most, and is accessible", async () => {
    bff = fakeBff({
      [`GET ${listPath}`]: () => Response.json([abandonedSaga, flaggedSaga]),
      [`GET ${listPath}/count`]: () => Response.json(2),
      "GET /bff/api/v1/orders/returns/needs-attention": () => Response.json([])
    })

    const { container } = show("/orders/sagas")
    const list = await screen.findByRole("listbox", { name: "Sagas" })

    expect(
      within(list)
        .getAllByRole("option")
        .map((option) => option.textContent?.slice(0, 21))
    ).toEqual(["ORD-20261021-3E5A7C9B", "ORD-20260917-E4C9664A"])

    const asked = bff.addresses.find((request) => request.route === `GET ${listPath}`)
    expect(new URL(asked?.url ?? "https://backoffice.test/").searchParams.get("limit")).toBe("200")
    expect(within(list).getByText("Abandoned")).toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("shows a saga's steps with the remedy order names for each, read only", async () => {
    bff = fakeBff({
      [`GET ${listPath}`]: () => Response.json([abandonedSaga, flaggedSaga]),
      [`GET ${listPath}/count`]: () => Response.json(2),
      "GET /bff/api/v1/orders/returns/needs-attention": () => Response.json([])
    })

    const user = userEvent.setup()
    const { router, container } = show("/orders/sagas")
    await screen.findByRole("listbox", { name: "Sagas" })

    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: abandonedSaga.sagaId }))

    const article = await screen.findByRole("article", { name: /ORD-20261021-3E5A7C9B/ })
    expect(within(article).getByText("Order no longer retries this saga.", { exact: false })).toBeInTheDocument()
    expect(within(article).getByText("Escrow held")).toBeInTheDocument()
    expect(within(article).getByText(/payment\.v1\.PaymentService\/RefundEscrow/)).toBeInTheDocument()
    expect(within(article).getByRole("link", { name: "Find ORD-20261021-3E5A7C9B" })).toHaveAttribute(
      "href",
      "/orders?orderNumber=ORD-20261021-3E5A7C9B"
    )

    expect(
      within(article)
        .queryAllByRole("button")
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["Copy Buyer", "Copy Saga id", "Copy Checkout request id"])

    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: flaggedSaga.sagaId }))
    expect(await screen.findByText("COMPLETED_WITHOUT_FULFILLMENT", { selector: "dd" })).toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("takes J and K from the page with focus on a saga in the list", async () => {
    bff = fakeBff({
      [`GET ${listPath}`]: () => Response.json([abandonedSaga, flaggedSaga]),
      [`GET ${listPath}/count`]: () => Response.json(2),
      "GET /bff/api/v1/orders/returns/needs-attention": () => Response.json([])
    })

    const user = userEvent.setup()
    const { router } = show("/orders/sagas")

    await user.click(await screen.findByRole("option", { name: /ORD-20260917-E4C9664A/ }))
    expect(screen.getByRole("option", { name: /ORD-20260917-E4C9664A/ })).toHaveFocus()
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: flaggedSaga.sagaId }))
    await user.keyboard("k")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: abandonedSaga.sagaId }))
    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: flaggedSaga.sagaId }))
  })

  it("filters the list by order number or failure code", async () => {
    bff = fakeBff({
      [`GET ${listPath}`]: () => Response.json([abandonedSaga, flaggedSaga]),
      [`GET ${listPath}/count`]: () => Response.json(2),
      "GET /bff/api/v1/orders/returns/needs-attention": () => Response.json([])
    })

    const user = userEvent.setup()
    show("/orders/sagas")
    await screen.findByRole("listbox", { name: "Sagas" })

    await user.keyboard("/")
    expect(screen.getByRole("searchbox", { name: "Filter sagas" })).toHaveFocus()
    await user.keyboard("fulfillment")

    expect(screen.getAllByRole("option")).toHaveLength(1)
    expect(screen.getByRole("option")).toHaveTextContent("ORD-20260917-E4C9664A")
  })

  it("reads the list once more when the count read after it disagrees, and not again", async () => {
    const counted = deferred()
    bff = fakeBff({
      [`GET ${listPath}`]: () => Response.json(lists() === 1 ? [abandonedSaga] : [abandonedSaga, flaggedSaga]),
      [`GET ${listPath}/count`]: () => counted.answer,
      "GET /bff/api/v1/orders/returns/needs-attention": () => Response.json([])
    })

    show("/orders/sagas")
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1))

    counted.release(Response.json(2))

    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(2))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(lists()).toBe(2)
  })
})
