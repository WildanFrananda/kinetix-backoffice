import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { MapScene } from "../../src/types/map_scene.type"
import { StreetMap } from "../../src/ui/map/StreetMap"
import { AppProviders, testQueryClient } from "../support/app_providers"
import { axeViolations } from "../support/axe"
import { fakeBff } from "../support/fake_bff"

const webgl = vi.hoisted(() => ({ available: false }))

const painter = vi.hoisted(() => ({
  mounts: 0,
  fail: false,
  zooms: [] as number[]
}))

vi.mock("../../src/ui/webgl2", () => ({ supportsWebgl2: () => webgl.available }))

vi.mock("../../src/map/street_map_painter", () => ({
  mountStreetMap: () => {
    painter.mounts += 1

    if (painter.fail) {
      throw new Error("WebGL context could not be created")
    }

    return {
      show: () => undefined,
      frame: () => undefined,
      setLocale: () => undefined,
      zoom: (by: number) => {
        painter.zooms.push(by)
      },
      resize: () => undefined,
      dispose: () => undefined
    }
  }
}))

const scene: MapScene = {
  places: [
    {
      id: "pickup-4813",
      kind: "pickup",
      tone: "job",
      point: { latitude: -6.1754, longitude: 106.8272 },
      label: "Pickup",
      selected: false
    },
    {
      id: "dropoff-4813",
      kind: "dropoff",
      tone: "job",
      point: { latitude: -6.2297, longitude: 106.8295 },
      label: "Drop-off",
      selected: false
    }
  ],
  routes: [
    {
      id: "job-4813",
      from: { latitude: -6.1754, longitude: 106.8272 },
      to: { latitude: -6.2297, longitude: 106.8295 },
      selected: true
    }
  ]
}

const manifest = {
  build: "2026-11-09",
  source: "https://build.protomaps.com/20261109.pmtiles",
  bbox: [106.35, -6.85, 107.25, -5.95],
  maxzoom: 15,
  bytes: 139897767,
  sha256: "bc1e33adfa5d8969e37bcb275f855851832fc28be40e689794c1692a25c9a887",
  written_at: "2026-11-09T17:50:12Z"
}

let bff = fakeBff({})

beforeEach(() => {
  webgl.available = false
  painter.mounts = 0
  painter.fail = false
  painter.zooms.length = 0
})

afterEach(() => {
  expect(bff.unexpected).toEqual([])
  vi.unstubAllGlobals()
})

function draw() {
  return render(
    <AppProviders client={testQueryClient()}>
      <StreetMap label="Map of job 4813" scene={scene} frame={[]} frameKey="4813" onChoose={() => undefined} />
    </AppProviders>
  )
}

describe("the street map", () => {
  it("draws the places on a grid without WebGL 2 and says how to get streets, asking nothing", async () => {
    bff = fakeBff({})

    const { container } = draw()

    expect(await screen.findByRole("note")).toHaveTextContent(
      "In Tor Browser, set webgl.enable-webgl2 to true in about:config and reload, or open the backoffice in Chrome."
    )

    expect(container.querySelector("figure")).toHaveAttribute("data-renderer", "svg")
    expect(container.querySelectorAll("svg[role='img'] circle")).toHaveLength(2)
    expect(container.querySelector("svg[role='img'] line[data-selected='true']")).not.toBeNull()
    expect(screen.getByText(/^\d+ m$|^\d+(\.\d+)? km$/)).toBeInTheDocument()
    expect(bff.seen).toEqual([])
    expect(painter.mounts).toBe(0)
    expect(await axeViolations(container)).toEqual([])
  })

  it("falls back to the grid, not an error, while the server holds no basemap", async () => {
    webgl.available = true
    bff = fakeBff({ "GET /tiles/basemap.json": () => new Response("", { status: 404 }) })

    const { container } = draw()

    expect(await screen.findByRole("note")).toHaveTextContent("this server holds no basemap")
    expect(container.querySelector("figure")).toHaveAttribute("data-renderer", "svg")
    expect(painter.mounts).toBe(0)
  })

  it("says the basemap's description could not be read when the server answers with something else", async () => {
    webgl.available = true
    bff = fakeBff({
      "GET /tiles/basemap.json": () => new Response("<!doctype html>", { headers: { "Content-Type": "text/html" } })
    })

    draw()

    expect(await screen.findByRole("note")).toHaveTextContent("could not be read (HTTP 200)")
  })

  it("draws the street map with WebGL 2 and the basemap, with our own attribution and zoom buttons", async () => {
    webgl.available = true
    bff = fakeBff({ "GET /tiles/basemap.json": () => Response.json(manifest) })

    const user = userEvent.setup()
    const { container } = draw()

    await waitFor(() => expect(container.querySelector("figure")).toHaveAttribute("data-renderer", "webgl"))
    expect(screen.getByText(/© OpenStreetMap contributors · Protomaps · basemap of 2026-11-09/)).toBeInTheDocument()
    expect(container.querySelector("svg[role='img']")).toBeNull()

    await user.click(screen.getByRole("button", { name: "Zoom in" }))
    await user.click(screen.getByRole("button", { name: "Zoom out" }))
    expect(painter.zooms).toEqual([1, -1])
  })

  it("falls back to the grid when MapLibre cannot start", async () => {
    webgl.available = true
    painter.fail = true
    bff = fakeBff({ "GET /tiles/basemap.json": () => Response.json(manifest) })

    const { container } = draw()

    expect(await screen.findByRole("note")).toHaveTextContent("it could not start in this browser")
    expect(container.querySelector("figure")).toHaveAttribute("data-renderer", "svg")
  })
})
