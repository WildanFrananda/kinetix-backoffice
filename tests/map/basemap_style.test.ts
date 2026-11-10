import { readFileSync } from "node:fs"
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec"
import { describe, expect, it } from "vitest"
import { glyphRanges } from "../../scripts/map_assets"
import { basemapStyle, mapAssetsBase } from "../../src/map/basemap_style"
import type { MapScene } from "../../src/types/map_scene.type"
import { themeTokens } from "../support/map_tokens"

const origin = "https://backoffice.test"

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
      id: "courier-21",
      kind: "courier",
      tone: "online",
      point: { latitude: -6.1689, longitude: 106.8203 },
      label: "21",
      selected: true
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

function styleFor(theme: "light" | "dark", locale: "en" | "id" = "en") {
  return basemapStyle({
    origin,
    assets: mapAssetsBase(origin),
    basemap: { bounds: [106.35, -6.85, 107.25, -5.95], maxZoom: 15 },
    tokens: themeTokens(theme),
    dark: theme === "dark",
    locale,
    scene
  })
}

function colours(value: unknown): string[] {
  const json = JSON.stringify(value)

  return [...json.matchAll(/"(#[0-9a-f]{3,8}|rgba?\([^)]*\))"/gi)].map((match) => (match[1] ?? "").toLowerCase())
}

function literalStrings(value: unknown, into: string[] = []): string[] {
  if (typeof value === "string") {
    into.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) {
      literalStrings(item, into)
    }
  }

  return into
}

describe("basemapStyle", () => {
  it("is a valid MapLibre style in both themes and both languages", () => {
    for (const theme of ["light", "dark"] as const) {
      for (const locale of ["en", "id"] as const) {
        expect(validateStyleMin(styleFor(theme, locale)), `${theme} ${locale}`).toEqual([])
      }
    }
  })

  it("asks only this origin: tiles under /tiles/, glyphs and sprites under the versioned /map/", () => {
    const lock = JSON.parse(readFileSync("map_assets.lock.json", "utf8")) as { version: string }
    const style = styleFor("light")

    expect(style.glyphs).toBe(`${origin}/map/${lock.version}/fonts/{fontstack}/{range}.pbf`)
    expect(style.sprite).toBe(`${origin}/map/${lock.version}/sprites/grayscale`)
    expect(styleFor("dark").sprite).toBe(`${origin}/map/${lock.version}/sprites/black`)
    expect(style.sources.protomaps).toEqual({
      type: "vector",
      tiles: [`pmtiles://${origin}/tiles/basemap.pmtiles/{z}/{x}/{y}`],
      minzoom: 0,
      maxzoom: 15,
      bounds: [106.35, -6.85, 107.25, -5.95]
    })

    expect(JSON.stringify(style)).not.toMatch(/https?:\/\/(?!backoffice\.test)/)
  })

  it("is coloured from the design tokens, and the accent marks only our own places", () => {
    for (const theme of ["light", "dark"] as const) {
      const tokens = themeTokens(theme)
      const style = styleFor(theme)
      const basemap = style.layers.filter((layer) => !layer.id.startsWith("kx-"))
      const background = basemap.find((layer) => layer.id === "earth")

      expect(JSON.stringify(background)).toContain(tokens.paper.toLowerCase())
      expect(colours(basemap)).not.toContain(tokens.accent.toLowerCase())
      expect(JSON.stringify(style.sources["kx-places"])).toContain(tokens.accent.toLowerCase())
      expect(JSON.stringify(style.sources["kx-routes"])).toContain(tokens.accent.toLowerCase())
    }

    expect(colours(styleFor("light").layers)).not.toEqual(colours(styleFor("dark").layers))
  })

  it("draws no points of interest and asks only for the fonts and icons the build carries", () => {
    const lock = JSON.parse(readFileSync("map_assets.lock.json", "utf8")) as { version: string }
    const style = styleFor("light")
    const sprite = JSON.parse(readFileSync(`public/map/${lock.version}/sprites/grayscale.json`, "utf8")) as object
    const strings = literalStrings(style.layers.map((layer) => ("layout" in layer ? layer.layout : undefined)))
    const fonts = new Set(strings.filter((value) => value.startsWith("Noto Sans")))

    expect(style.layers.some((layer) => layer.id === "pois")).toBe(false)

    for (const font of fonts) {
      if (!font.includes("Devanagari")) {
        expect(Object.keys(glyphRanges), font).toContain(font)
      }
    }

    for (const layer of style.layers) {
      const icon = "layout" in layer ? (layer.layout as Record<string, unknown> | undefined)?.["icon-image"] : undefined
      if (typeof icon === "string") {
        expect(Object.keys(sprite), icon).toContain(icon)
      }
    }

    for (const name of ["arrow", "townspot", "capital", "generic_shield-3char"]) {
      expect(Object.keys(sprite)).toContain(name)
    }
  })

  it("labels places in the admin's language", () => {
    expect(JSON.stringify(styleFor("light", "id"))).toContain('"name:id"')
    expect(JSON.stringify(styleFor("light", "en"))).toContain('"name:en"')
  })
})
