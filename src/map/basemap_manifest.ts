import * as v from "valibot"
import { instantSchema } from "../api/schemas/instant_schema"
import type { BasemapManifest } from "../types/basemap_manifest.type"

const manifestPath = "/tiles/basemap.json"

const longitude = v.pipe(v.number(), v.finite(), v.minValue(-180), v.maxValue(180))

const latitude = v.pipe(v.number(), v.finite(), v.minValue(-90), v.maxValue(90))

const manifestSchema = v.pipe(
  v.object({
    build: v.pipe(v.string(), v.isoDate()),
    source: v.pipe(v.string(), v.url()),
    bbox: v.pipe(
      v.tuple([longitude, latitude, longitude, latitude]),
      v.check(([west, south, east, north]) => west < east && south < north)
    ),
    maxzoom: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(24)),
    bytes: v.pipe(v.number(), v.integer(), v.minValue(1)),
    sha256: v.pipe(v.string(), v.regex(/^[0-9a-f]{64}$/)),
    written_at: instantSchema
  }),
  v.transform(
    (manifest): BasemapManifest => ({
      build: manifest.build,
      source: manifest.source,
      bounds: manifest.bbox,
      maxZoom: manifest.maxzoom,
      bytes: manifest.bytes,
      sha256: manifest.sha256,
      writtenAt: manifest.written_at
    })
  )
)

class BasemapUnreadable extends Error {
  readonly status: number

  constructor(status: number) {
    super(`The basemap's manifest could not be read (HTTP ${status})`)
    this.name = "BasemapUnreadable"
    this.status = status
  }
}

async function readBasemapManifest(signal?: AbortSignal): Promise<BasemapManifest | null> {
  const init: RequestInit = { cache: "no-cache", credentials: "same-origin", headers: { Accept: "application/json" } }

  if (signal !== undefined) {
    init.signal = signal
  }

  const response = await fetch(new URL(manifestPath, window.location.origin).href, init)
  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new BasemapUnreadable(response.status)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new BasemapUnreadable(response.status)
  }

  const parsed = v.safeParse(manifestSchema, body)
  if (!parsed.success) {
    throw new BasemapUnreadable(response.status)
  }

  return parsed.output
}

export { BasemapUnreadable, manifestPath, readBasemapManifest }
