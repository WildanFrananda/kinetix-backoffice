import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CategoriesPage } from "../../src/features/categories/CategoriesPage"
import { categoriesSearch } from "../../src/features/categories/categories_search"
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

const stored = [
  { id: 4, name: "Pakaian", slug: "pakaian" },
  { id: 3, name: "Aksesori", slug: "aksesori" },
  { id: 9, name: "Elektronik", slug: "elektronik" }
]

function refusal(status: number, body: object) {
  return () => Response.json({ ...body, traceId: "6f1c2b9e-3d4a-4f5e-8a7b-9c0d1e2f3a4b" }, { status })
}

function show(path: string) {
  const root = createRootRoute()

  const page = createRoute({
    getParentRoute: () => root,
    path: "/catalog/categories",
    validateSearch: categoriesSearch,
    component: function CategoriesRoute() {
      const navigate = page.useNavigate()

      return (
        <CategoriesPage search={page.useSearch()} onSearch={(next) => void navigate({ search: next, ...inPlace })} />
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

function names(): string[] {
  return within(screen.getByRole("listbox", { name: "All categories" }))
    .getAllByRole("option")
    .map((option) => option.querySelector("[slot='label']")?.textContent ?? "")
}

function asked(route: string): number {
  return bff.seen.filter((request) => request.route === route).length
}

describe("categories", () => {
  it("lists every category by name, says how many, and is accessible", async () => {
    bff = fakeBff({ "GET /bff/api/v1/categories": () => Response.json(stored) })

    const { container } = show("/catalog/categories")

    expect(await screen.findByRole("option", { name: "Aksesori" })).toBeInTheDocument()
    expect(names()).toEqual(["Aksesori", "Elektronik", "Pakaian"])
    expect(screen.getByText("3 in all")).toBeInTheDocument()
    expect(screen.getByText("Nothing chosen")).toBeInTheDocument()
    expect(await axeViolations(container)).toEqual([])
  })

  it("narrows the list by name, slug or id", async () => {
    bff = fakeBff({ "GET /bff/api/v1/categories": () => Response.json(stored) })

    const user = userEvent.setup()
    show("/catalog/categories")
    await screen.findByRole("option", { name: "Aksesori" })

    await user.type(screen.getByRole("searchbox", { name: "Find a category" }), "elek")
    expect(names()).toEqual(["Elektronik"])

    await user.clear(screen.getByRole("searchbox", { name: "Find a category" }))
    await user.type(screen.getByRole("searchbox", { name: "Find a category" }), "kaos")
    expect(screen.getByText("No category matches “kaos”.")).toBeInTheDocument()
  })

  it("creates a category, its slug following the name until it is edited", async () => {
    let listed = stored
    bff = fakeBff({
      "GET /bff/api/v1/categories": () => Response.json(listed),
      "POST /bff/api/v1/categories": () => {
        listed = [...stored, { id: 12, name: "Kopi & Teh", slug: "kopi-teh" }]

        return Response.json({ id: 12, name: "Kopi & Teh", slug: "kopi-teh" }, { status: 201 })
      }
    })

    const user = userEvent.setup()
    const { router } = show("/catalog/categories")
    await screen.findByRole("option", { name: "Aksesori" })

    await user.click(screen.getByRole("button", { name: "New category" }))
    expect(router.state.location.search).toEqual({ creating: true })
    await user.type(await screen.findByRole("textbox", { name: "Name" }), "  Kopi & Teh")
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue("kopi-teh")

    await user.click(screen.getByRole("button", { name: "Create category" }))

    expect(await screen.findByText("Created “Kopi & Teh”.")).toBeInTheDocument()
    expect(bff.seen.find((request) => request.route === "POST /bff/api/v1/categories")?.body).toEqual({
      name: "Kopi & Teh",
      slug: "kopi-teh"
    })

    expect(router.state.location.search).toEqual({ selected: 12 })
    expect(await screen.findByRole("heading", { level: 2, name: "Kopi & Teh" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Kopi & Teh" })).toHaveAttribute("aria-selected", "true")
  })

  it("keeps a slug the admin typed, and refuses what catalog would refuse before asking", async () => {
    bff = fakeBff({ "GET /bff/api/v1/categories": () => Response.json(stored) })

    const user = userEvent.setup()
    show("/catalog/categories?creating=true")
    const slug = await screen.findByRole("textbox", { name: "Slug" })

    await user.type(slug, "kopi teh")
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Kopi")
    expect(slug).toHaveValue("kopi teh")

    await user.click(screen.getByRole("button", { name: "Create category" }))
    expect(
      await screen.findByText("Use 1 to 128 letters, digits, hyphens or underscores, with no spaces.")
    ).toBeInTheDocument()

    await user.clear(screen.getByRole("textbox", { name: "Name" }))
    await user.click(screen.getByRole("button", { name: "Create category" }))
    expect(await screen.findByText("Give the category a name.")).toBeInTheDocument()
    expect(asked("POST /bff/api/v1/categories")).toBe(0)
  })

  it("shows catalog's refusal when the name or slug is taken, and creates nothing", async () => {
    bff = fakeBff({
      "GET /bff/api/v1/categories": () => Response.json(stored),
      "POST /bff/api/v1/categories": refusal(409, {
        error: "CATEGORY_TAKEN",
        message: "another category already uses the name Pakaian or the slug pakaian"
      })
    })

    const user = userEvent.setup()
    show("/catalog/categories?creating=true")
    await user.type(await screen.findByRole("textbox", { name: "Name" }), "Pakaian")
    await user.click(screen.getByRole("button", { name: "Create category" }))

    const alert = await screen.findByRole("alert")
    expect(alert).toHaveTextContent("Another category already uses this name or this slug.")
    expect(
      within(alert).getByText("another category already uses the name Pakaian or the slug pakaian")
    ).toHaveAttribute("lang", "en")

    expect(screen.getByRole("heading", { level: 2, name: "New category" })).toBeInTheDocument()
  })

  it("renames a category, warns that discounts follow the slug, and saves both", async () => {
    let listed = stored
    bff = fakeBff({
      "GET /bff/api/v1/categories": () => Response.json(listed),
      "PUT /bff/api/v1/categories/4": () => {
        const saved = { id: 4, name: "Pakaian Pria", slug: "pakaian-pria" }
        listed = stored.map((category) => (category.id === 4 ? saved : category))

        return Response.json(saved)
      }
    })

    const user = userEvent.setup()
    show("/catalog/categories?selected=4")
    expect(await screen.findByRole("heading", { level: 2, name: "Pakaian" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()

    await user.type(screen.getByRole("textbox", { name: "Name" }), " Pria")
    expect(screen.getByRole("textbox", { name: "Slug" })).toHaveValue("pakaian")
    expect(screen.queryByText(/discount set on “pakaian”/)).not.toBeInTheDocument()

    await user.clear(screen.getByRole("textbox", { name: "Slug" }))
    await user.type(screen.getByRole("textbox", { name: "Slug" }), "pakaian-pria")
    expect(screen.getByText(/discount set on “pakaian” stops applying/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByText("Saved “Pakaian Pria”.")).toBeInTheDocument()
    expect(bff.seen.find((request) => request.route === "PUT /bff/api/v1/categories/4")?.body).toEqual({
      name: "Pakaian Pria",
      slug: "pakaian-pria"
    })

    expect(await screen.findByRole("heading", { level: 2, name: "Pakaian Pria" })).toBeInTheDocument()
    expect(screen.queryByText(/stops applying/)).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled()
  })

  it("reads the list again when the category was deleted by someone else", async () => {
    let listed = stored
    bff = fakeBff({
      "GET /bff/api/v1/categories": () => Response.json(listed),
      "PUT /bff/api/v1/categories/9": () => {
        listed = stored.filter((category) => category.id !== 9)

        return refusal(404, { error: "CATEGORY_NOT_FOUND", message: "no category with this id" })()
      }
    })

    const user = userEvent.setup()
    show("/catalog/categories?selected=9")
    await user.type(await screen.findByRole("textbox", { name: "Name" }), "s")
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    expect(await screen.findByText("Nothing chosen")).toBeInTheDocument()
    await waitFor(() => expect(names()).toEqual(["Aksesori", "Pakaian"]))
    expect(asked("GET /bff/api/v1/categories")).toBe(2)
  })

  it("deletes after a confirmation that offers Cancel first, and explains a category still in use", async () => {
    let inUse = true
    bff = fakeBff({
      "GET /bff/api/v1/categories": () => Response.json(inUse ? stored : stored.filter((c) => c.id !== 3)),
      "DELETE /bff/api/v1/categories/3": () => {
        if (inUse) {
          inUse = false

          return refusal(409, {
            error: "CATEGORY_IN_USE",
            message: "category 3 still holds 12 product(s), active or withdrawn; move them to another category first",
            product_count: 12
          })()
        }

        return new Response(null, { status: 204 })
      }
    })

    const user = userEvent.setup()
    const { router } = show("/catalog/categories?selected=3")
    await user.click(await screen.findByRole("button", { name: "Delete category" }))

    const dialog = await screen.findByRole("alertdialog", { name: "Delete “Aksesori”?" })
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus()

    await user.click(within(dialog).getByRole("button", { name: "Delete" }))
    expect(await within(dialog).findByText(/Products are still filed under this category/)).toBeInTheDocument()
    expect(within(dialog).getByText(/still holds 12 product/)).toHaveAttribute("lang", "en")

    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    expect(await screen.findByText("Deleted “Aksesori”.")).toBeInTheDocument()
    expect(router.state.location.search).toEqual({})
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument())
    expect(names()).toEqual(["Elektronik", "Pakaian"])
  })

  it("moves with J and K, opens a new form with N and asks before deleting with D", async () => {
    bff = fakeBff({ "GET /bff/api/v1/categories": () => Response.json(stored) })

    const user = userEvent.setup()
    const { router } = show("/catalog/categories")
    await screen.findByRole("option", { name: "Aksesori" })
    expect(screen.getByRole("list", { name: "Keyboard shortcuts" })).toBeInTheDocument()

    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: 3 }))
    await user.keyboard("j")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: 9 }))
    await user.keyboard("k")
    await waitFor(() => expect(router.state.location.search).toEqual({ selected: 3 }))

    await user.keyboard("d")
    expect(await screen.findByRole("alertdialog", { name: "Delete “Aksesori”?" })).toBeInTheDocument()
    await user.keyboard("{Escape}")

    await user.keyboard("n")
    await waitFor(() => expect(router.state.location.search).toEqual({ creating: true }))
  })
})
