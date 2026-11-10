import { afterEach, describe, expect, it, vi } from "vitest"
import { BasemapUnreadable, readBasemapManifest } from "../../src/map/basemap_manifest"

function answer(response: Response) {
  const seen: string[] = []

  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      seen.push(new Request(input).url)

      return response
    })
  )

  return seen
}

const written = {
  build: "2026-11-09",
  source: "https://build.protomaps.com/20261109.pmtiles",
  bbox: [106.35, -6.85, 107.25, -5.95],
  maxzoom: 15,
  bytes: 139897767,
  sha256: "bc1e33adfa5d8969e37bcb275f855851832fc28be40e689794c1692a25c9a887",
  written_at: "2026-11-09T17:50:12Z"
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("readBasemapManifest", () => {
  it("reads the build of the basemap the server holds, from this origin", async () => {
    const seen = answer(Response.json(written))

    const manifest = await readBasemapManifest()

    expect(manifest).toEqual({
      build: "2026-11-09",
      source: "https://build.protomaps.com/20261109.pmtiles",
      bounds: [106.35, -6.85, 107.25, -5.95],
      maxZoom: 15,
      bytes: 139897767,
      sha256: written.sha256,
      writtenAt: new Date("2026-11-09T17:50:12Z")
    })

    expect(seen).toEqual(["https://backoffice.test/tiles/basemap.json"])
  })

  it("reads a 404 as no basemap, not as a failure", async () => {
    answer(new Response("", { status: 404 }))

    await expect(readBasemapManifest()).resolves.toBeNull()
  })

  it("refuses the app's page, a body it does not know and a server failure", async () => {
    answer(new Response("<!doctype html><html></html>", { status: 200, headers: { "Content-Type": "text/html" } }))
    await expect(readBasemapManifest()).rejects.toBeInstanceOf(BasemapUnreadable)

    answer(Response.json({ ...written, build: "20261109" }))
    await expect(readBasemapManifest()).rejects.toBeInstanceOf(BasemapUnreadable)

    answer(Response.json({ ...written, bbox: [107.25, -6.85, 106.35, -5.95] }))
    await expect(readBasemapManifest()).rejects.toBeInstanceOf(BasemapUnreadable)

    const { written_at: _, ...unstamped } = written
    answer(Response.json(unstamped))
    await expect(readBasemapManifest()).rejects.toBeInstanceOf(BasemapUnreadable)

    answer(new Response("", { status: 503 }))
    await expect(readBasemapManifest()).rejects.toMatchObject({ status: 503 })
  })
})
