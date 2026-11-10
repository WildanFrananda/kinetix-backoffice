import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DispatchPage } from "../../src/features/fleet/DispatchPage"
import { dispatchSearch, fleetSearch } from "../../src/features/fleet/fleet_search"
import { formatDistance } from "../../src/i18n/format_distance"
import { distanceKm } from "../../src/map/distance"
import { inPlace } from "../../src/ui/in_place"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"
import {
  busyCourier,
  deliveredJob,
  idleCourier,
  type Job,
  pendingJob,
  phoenixFailure,
  photoUrl,
  refusal,
  signature,
  unboundJob,
  withProof
} from "../support/matching_answers"

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

const base = "/bff/api/v1/matching/backoffice/dispatches"

type Route = (request: Request) => Response | Promise<Response>

function board(jobs: Job[], extra: Record<string, Route> = {}) {
  return {
    [`GET ${base}/summary`]: () => Response.json({ data: { pending: 3, active: 11, delivered_today: 42 } }),
    [`GET ${base}`]: () => Response.json({ data: jobs, next_cursor: null }),
    ...extra
  }
}

function detail(job: Job | (() => Job)): Route {
  return () => Response.json({ data: withProof(typeof job === "function" ? job() : job) })
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

function show(path: string) {
  const root = createRootRoute()

  const page = createRoute({
    getParentRoute: () => root,
    path: "/dispatch",
    validateSearch: dispatchSearch,
    component: function DispatchRoute() {
      const navigate = page.useNavigate()

      return <DispatchPage search={page.useSearch()} onSearch={(next) => void navigate({ search: next, ...inPlace })} />
    }
  })

  const fleet = createRoute({
    getParentRoute: () => root,
    path: "/fleet",
    validateSearch: fleetSearch,
    component: () => null
  })

  const router = createRouter({
    routeTree: root.addChildren([page, fleet]),
    history: createMemoryHistory({ initialEntries: [path] })
  })

  const view = render(
    <AppProviders client={testQueryClient()}>
      <RouterProvider router={router} />
    </AppProviders>
  )

  return { router, ...view }
}

async function jobDetail(id: number) {
  return screen.findByRole("article", { name: `Job ${id}` })
}

describe("the dispatch board", () => {
  it("shows the board's counts and the jobs newest first, and is accessible", async () => {
    bff = fakeBff(board([pendingJob, deliveredJob, unboundJob]))

    const { container } = show("/dispatch")

    expect(await screen.findByRole("option", { name: /4813/ })).toBeInTheDocument()
    expect(screen.getAllByRole("option").map((option) => option.textContent?.slice(0, 4))).toEqual([
      "4813",
      "4812",
      "3920"
    ])

    const counts = screen.getByRole("region", { name: "The board's counts" })
    await waitFor(() => expect(within(counts).getByText("42")).toBeInTheDocument())
    expect(screen.getByRole("list", { name: "Keys on this page" })).toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("asks matching for one status and the older page with before", async () => {
    let next: number | null = 4700
    bff = fakeBff(
      board([], {
        [`GET ${base}`]: () => Response.json({ data: [pendingJob], next_cursor: next })
      })
    )

    const user = userEvent.setup()
    const { router } = show("/dispatch")

    await screen.findByRole("option", { name: /4813/ })
    await user.click(screen.getByRole("radio", { name: "Waiting" }))
    await waitFor(() => expect(router.state.location.search).toEqual({ status: "pending" }))
    next = null
    await user.click(await screen.findByRole("button", { name: "Older" }))
    await waitFor(() => expect(router.state.location.search).toEqual({ status: "pending", before: 4700 }))

    const lists = bff.seen.filter((request) => request.route === `GET ${base}`)
    expect(lists.length).toBeGreaterThanOrEqual(3)
  })

  it("shows a job on the plane drawing when the browser has no WebGL 2, with the straight-line distance", async () => {
    bff = fakeBff(board([pendingJob], { [`GET ${base}/4813`]: detail(pendingJob) }))

    const { container } = show("/dispatch?job=4813")
    const article = await jobDetail(4813)
    const kilometres = formatDistance(distanceKm(pendingJob.pickup, pendingJob.dropoff), "en")

    expect(within(article).getByText(`${kilometres} in a straight line`)).toBeInTheDocument()
    expect(within(article).getByText("ORD-20261022-7F3A91C2")).toBeInTheDocument()
    expect(within(article).getByText("No courier holds this job.")).toBeInTheDocument()
    expect(
      within(article).getByRole("img", {
        name: "Map of job 4813, drawn on a latitude and longitude grid without streets"
      })
    ).toBeInTheDocument()

    expect(within(article).getByText(/WebGL 2 switched off/)).toHaveTextContent("webgl.enable-webgl2")
    expect(container.querySelector("figure[data-renderer='svg'] circle[data-kind='pickup']")).not.toBeNull()
    expect(within(article).getByText(/belongs to order ORD-20261022-7F3A91C2/)).toBeInTheDocument()
    expect(within(article).queryByRole("button", { name: "Cancel job" })).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it("assigns with A to an online courier only, shows it at once, and keeps matching's answer", async () => {
    const held = deferred()
    let current: Job = pendingJob
    bff = fakeBff(
      board([pendingJob], {
        [`GET ${base}/4813`]: detail(() => current),
        "GET /bff/api/v1/matching/drivers/nearby": () =>
          Response.json({
            data: [
              { ...busyCourier, distance_km: 0.581 },
              { ...idleCourier, distance_km: 1.051 }
            ]
          }),
        [`POST ${base}/4813/assign`]: () => held.answer,
        "GET /bff/api/v1/matching/drivers/21": () => Response.json({ data: idleCourier })
      })
    )

    const user = userEvent.setup()
    show("/dispatch?job=4813")
    const article = await jobDetail(4813)

    await user.keyboard("a")
    const panel = await within(article).findByRole("region", { name: "Couriers near the pickup" })
    const busy = (await within(panel).findByText("Courier 17")).closest("li")
    const online = within(panel).getByText("Courier 21").closest("li")

    expect(busy).not.toBeNull()
    expect(within(busy as HTMLElement).queryByRole("button")).toBeNull()
    expect(within(busy as HTMLElement).getByText("Only an online courier can take a job.")).toBeInTheDocument()
    expect(within(online as HTMLElement).getByText(/581 m|1.05 km/)).toBeInTheDocument()

    const nearby = bff.seen.find((request) => request.route === "GET /bff/api/v1/matching/drivers/nearby")
    expect(nearby).toBeDefined()

    await user.click(within(panel).getByRole("button", { name: "Assign courier 21" }))
    const dialog = await screen.findByRole("alertdialog", { name: "Give job 4813 to courier 21?" })
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Assign" })).toHaveFocus())
    await user.keyboard("{Enter}")

    expect(await within(article).findByText("Giving job 4813 to courier 21…")).toBeInTheDocument()
    await waitFor(() =>
      expect(within(article).getByText("Assigned", { selector: "span[data-tone]" })).toBeInTheDocument()
    )

    current = { ...pendingJob, status: "assigned", driver_id: 21, assigned_at: "2026-10-22T03:15:02.187430Z" }
    held.release(Response.json({ data: current }))

    expect(await within(article).findByText("Job 4813 is with courier 21.")).toBeInTheDocument()
    expect(bff.seen.find((request) => request.route === `POST ${base}/4813/assign`)?.body).toEqual({ driver_id: 21 })
  })

  it("rolls an assignment back when matching refuses it, in words, and reads the job again", async () => {
    const held = deferred()
    bff = fakeBff(
      board([pendingJob], {
        [`GET ${base}/4813`]: detail(pendingJob),
        "GET /bff/api/v1/matching/drivers/nearby": () =>
          Response.json({ data: [{ ...idleCourier, distance_km: 1.051 }] }),
        [`POST ${base}/4813/assign`]: () => held.answer,
        "GET /bff/api/v1/matching/drivers/21": () => Response.json({ data: idleCourier })
      })
    )

    const user = userEvent.setup()
    show("/dispatch?job=4813")
    const article = await jobDetail(4813)

    await user.click(within(article).getByRole("button", { name: "Assign a courier" }))
    await user.click(await within(article).findByRole("button", { name: "Assign courier 21" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Assign" }))

    await waitFor(() =>
      expect(within(article).getByText("Assigned", { selector: "span[data-tone]" })).toBeInTheDocument()
    )

    const reads = bff.seen.filter((request) => request.route === `GET ${base}/4813`).length
    held.release(Response.json({ error: "driver_unavailable" }, { status: 409 }))

    expect(await within(article).findByRole("alert")).toHaveTextContent(
      "Courier 21 is no longer online: busy, or off duty."
    )

    expect(within(article).getByText("Waiting", { selector: "span[data-tone]" })).toBeInTheDocument()
    await waitFor(() =>
      expect(bff.seen.filter((request) => request.route === `GET ${base}/4813`).length).toBeGreaterThan(reads)
    )
  })

  it("reads the job again after a 503 and finds the assignment made", async () => {
    let current: Job = pendingJob
    bff = fakeBff(
      board([pendingJob], {
        [`GET ${base}/4813`]: detail(() => current),
        "GET /bff/api/v1/matching/drivers/nearby": () =>
          Response.json({ data: [{ ...idleCourier, distance_km: 1.051 }] }),
        [`POST ${base}/4813/assign`]: () => {
          current = { ...pendingJob, status: "assigned", driver_id: 21, assigned_at: "2026-10-22T03:15:02.187430Z" }

          return phoenixFailure(503, "Service Unavailable")()
        },
        "GET /bff/api/v1/matching/drivers/21": () => Response.json({ data: idleCourier })
      })
    )

    const user = userEvent.setup()
    show("/dispatch?job=4813")
    const article = await jobDetail(4813)

    await user.click(within(article).getByRole("button", { name: "Assign a courier" }))
    await user.click(await within(article).findByRole("button", { name: "Assign courier 21" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Assign" }))

    expect(await within(article).findByText(/the job was read again and the change was made/)).toHaveTextContent(
      "Job 4813 is with courier 21."
    )

    expect(bff.seen.filter((request) => request.route === `POST ${base}/4813/assign`)).toHaveLength(1)
  })

  it("reads the job again after a 500, finds it unchanged and offers to try again", async () => {
    bff = fakeBff(
      board([pendingJob], {
        [`GET ${base}/4813`]: detail(pendingJob),
        "GET /bff/api/v1/matching/drivers/nearby": () =>
          Response.json({ data: [{ ...idleCourier, distance_km: 1.051 }] }),
        [`POST ${base}/4813/assign`]: phoenixFailure(500, "something went wrong handling this request"),
        "GET /bff/api/v1/matching/drivers/21": () => Response.json({ data: idleCourier })
      })
    )

    const user = userEvent.setup()
    show("/dispatch?job=4813")
    const article = await jobDetail(4813)
    function reads(): number {
      return bff.seen.filter((request) => request.route === `GET ${base}/4813`).length
    }

    await user.click(within(article).getByRole("button", { name: "Assign a courier" }))
    await user.click(await within(article).findByRole("button", { name: "Assign courier 21" }))

    const before = reads()
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Assign" }))

    expect(await within(article).findByRole("alert")).toHaveTextContent("it is unchanged, so nothing was done")
    expect(reads()).toBeGreaterThan(before)
    expect(within(article).getByText("Waiting", { selector: "span[data-tone]" })).toBeInTheDocument()

    await user.click(within(article).getByRole("button", { name: "Try again" }))
    expect(await screen.findByRole("alertdialog", { name: "Give job 4813 to courier 21?" })).toBeInTheDocument()
  })

  it("takes a job off its courier with U, Keep it focused, at once", async () => {
    const assigned: Job = {
      ...pendingJob,
      status: "assigned",
      driver_id: 17,
      assigned_at: "2026-10-22T03:15:02.187430Z"
    }

    const held = deferred()
    bff = fakeBff(
      board([assigned], {
        [`GET ${base}/4813`]: detail(assigned),
        "GET /bff/api/v1/matching/drivers/17": () => Response.json({ data: busyCourier }),
        [`POST ${base}/4813/unassign`]: () => held.answer
      })
    )

    const user = userEvent.setup()
    show("/dispatch?job=4813")
    const article = await jobDetail(4813)

    expect(await within(article).findByText("Courier 17")).toBeInTheDocument()
    await user.keyboard("u")

    const dialog = await screen.findByRole("alertdialog", { name: "Take job 4813 off courier 17?" })
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Keep it" })).toHaveFocus())
    await user.click(within(dialog).getByRole("button", { name: "Unassign" }))

    expect(await within(article).findByText("Taking job 4813 off courier 17…")).toBeInTheDocument()
    await waitFor(() =>
      expect(within(article).getByText("Waiting", { selector: "span[data-tone]" })).toBeInTheDocument()
    )

    held.release(Response.json({ data: pendingJob }))

    expect(await within(article).findByText("Job 4813 is waiting again.")).toBeInTheDocument()
    expect(bff.seen.find((request) => request.route === `POST ${base}/4813/unassign`)?.body).toBeNull()
  })

  it("says in words when matching will not cancel a job bound to an order", async () => {
    bff = fakeBff(
      board([unboundJob], {
        [`GET ${base}/3920`]: detail(unboundJob),
        [`POST ${base}/3920/cancel`]: refusal(409, "bound_to_order")
      })
    )

    const user = userEvent.setup()
    show("/dispatch?job=3920")
    await jobDetail(3920)
    await user.keyboard("x")

    const dialog = await screen.findByRole("alertdialog", { name: "Cancel job 3920?" })
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Keep it" })).toHaveFocus())
    await user.click(within(dialog).getByRole("button", { name: "Cancel job" }))

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Matching refused: this job belongs to an order, and only the order can cancel it."
    )

    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
  })

  it("cancels a job no order waits for", async () => {
    let current: Job = unboundJob
    bff = fakeBff(
      board([unboundJob], {
        [`GET ${base}/3920`]: detail(() => current),
        [`POST ${base}/3920/cancel`]: () => {
          current = { ...unboundJob, status: "cancelled" }

          return Response.json({ data: current })
        }
      })
    )

    const user = userEvent.setup()
    show("/dispatch?job=3920")
    const article = await jobDetail(3920)

    await user.click(within(article).getByRole("button", { name: "Cancel job" }))
    await user.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel job" }))

    expect(await within(article).findByText("Job 3920 is cancelled.")).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole("alertdialog")).toBeNull())
    expect(within(article).queryByRole("button", { name: "Cancel job" })).toBeNull()
  })

  it("shows a delivered job's proof: the photo from storage and the signature drawn", async () => {
    vi.stubGlobal("createImageBitmap", async () => ({ width: 1, height: 1, close: () => undefined }))
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: () => undefined } as never)
    bff = fakeBff(
      board([deliveredJob], {
        [`GET ${base}/4812`]: () =>
          Response.json({ data: withProof(deliveredJob, { photo_url: photoUrl, signature }) }),
        "GET /bff/api/v1/matching/drivers/21": () => Response.json({ data: idleCourier })
      })
    )

    show("/dispatch?job=4812")
    const article = await jobDetail(4812)
    const photo = await within(article).findByRole("img", {
      name: "The photo the courier took at the drop-off of job 4812"
    })

    expect(photo).toHaveAttribute("src", photoUrl)
    expect(photo).toHaveAttribute("referrerpolicy", "no-referrer")
    expect(
      await within(article).findByRole("img", { name: "The signature of the recipient of job 4812" })
    ).toHaveAttribute("data-state", "drawn")

    expect(within(article).queryByRole("button", { name: "Assign a courier" })).toBeNull()
  })

  it("moves through the jobs with J and K", async () => {
    bff = fakeBff(
      board([pendingJob, deliveredJob], {
        [`GET ${base}/4813`]: detail(pendingJob),
        [`GET ${base}/4812`]: detail(deliveredJob),
        "GET /bff/api/v1/matching/drivers/21": () => Response.json({ data: idleCourier })
      })
    )

    const user = userEvent.setup()
    const { router } = show("/dispatch")

    await screen.findByRole("option", { name: /4813/ })
    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ job: 4813 }))
    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ job: 4812 }))
    await user.keyboard("k")
    await waitFor(() => expect(router.state.location.search).toEqual({ job: 4813 }))
  })

  it("takes J and K from the page with focus on a job in the list", async () => {
    bff = fakeBff(
      board([pendingJob, deliveredJob], {
        [`GET ${base}/4813`]: detail(pendingJob),
        [`GET ${base}/4812`]: detail(deliveredJob),
        "GET /bff/api/v1/matching/drivers/21": () => Response.json({ data: idleCourier })
      })
    )

    const user = userEvent.setup()
    const { router } = show("/dispatch")

    await user.click(await screen.findByRole("option", { name: /4813/ }))
    expect(screen.getByRole("option", { name: /4813/ })).toHaveFocus()
    await waitFor(() => expect(router.state.location.search).toEqual({ job: 4813 }))
    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ job: 4812 }))
    await user.keyboard("k")
    await waitFor(() => expect(router.state.location.search).toEqual({ job: 4813 }))
  })

  it("says a job matching does not have, and opens a job by number from the filter", async () => {
    bff = fakeBff(
      board([pendingJob], {
        [`GET ${base}/77`]: refusal(404, "not_found")
      })
    )

    const user = userEvent.setup()
    const { router } = show("/dispatch")

    await screen.findByRole("option", { name: /4813/ })
    await user.keyboard("/")
    expect(screen.getByRole("searchbox", { name: "Find on this page" })).toHaveFocus()
    await user.keyboard("77")
    await user.click(screen.getByRole("button", { name: "Open job 77" }))
    await waitFor(() => expect(router.state.location.search).toEqual({ job: 77 }))
    expect(await screen.findByText("Matching has no job 77.")).toBeInTheDocument()
  })

  it("reads a job again when a newer list disagrees, once, never in a loop", async () => {
    bff = fakeBff(
      board([{ ...pendingJob, status: "assigned", driver_id: 17 }], {
        [`GET ${base}/4813`]: detail(pendingJob)
      })
    )

    show("/dispatch?job=4813")
    await jobDetail(4813)
    await new Promise((resolve) => setTimeout(resolve, 400))

    expect(bff.seen.filter((request) => request.route === `GET ${base}/4813`).length).toBeLessThanOrEqual(2)
  })
})
