import { layers } from "@protomaps/basemaps"
import type { LayerSpecification, StyleSpecification } from "maplibre-gl"
import { version as mapAssetsVersion } from "../../map_assets.lock.json"
import type { BasemapStyleOptions } from "../types/basemap_style_options.type"
import { basemapFlavor } from "./basemap_flavor"
import { placeFeatures, routeFeatures } from "./scene_features"

const basemapSource = "protomaps"

const placesSource = "kx-places"

const routesSource = "kx-routes"

const placesLayer = "kx-places"

function mapAssetsBase(origin: string): string {
  return `${origin}/map/${mapAssetsVersion}`
}

function basemapUrl(origin: string): string {
  return `pmtiles://${origin}/tiles/basemap.pmtiles`
}

function overlayLayers(options: BasemapStyleOptions): LayerSpecification[] {
  return [
    {
      id: routesSource,
      type: "line",
      source: routesSource,
      layout: { "line-cap": "round" },
      paint: { "line-color": ["get", "color"], "line-width": ["get", "width"], "line-dasharray": [2, 1.5] }
    },
    {
      id: placesLayer,
      type: "circle",
      source: placesSource,
      paint: {
        "circle-color": ["get", "fill"],
        "circle-radius": ["get", "radius"],
        "circle-stroke-color": ["get", "stroke"],
        "circle-stroke-width": ["get", "strokeWidth"]
      }
    },
    {
      id: "kx-place-labels",
      type: "symbol",
      source: placesSource,
      layout: {
        "text-field": ["get", "label"],
        "text-font": ["Noto Sans Medium"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 0.9],
        "text-optional": true
      },
      paint: {
        "text-color": options.tokens.ink,
        "text-halo-color": options.tokens.paper,
        "text-halo-width": 1.5
      }
    }
  ]
}

function basemapStyle(options: BasemapStyleOptions): StyleSpecification {
  return {
    version: 8,
    glyphs: `${options.assets}/fonts/{fontstack}/{range}.pbf`,
    sprite: `${options.assets}/sprites/${options.dark ? "black" : "grayscale"}`,
    sources: {
      [basemapSource]: {
        type: "vector",
        tiles: [`${basemapUrl(options.origin)}/{z}/{x}/{y}`],
        minzoom: 0,
        maxzoom: options.basemap.maxZoom,
        bounds: options.basemap.bounds
      },
      [routesSource]: { type: "geojson", data: routeFeatures(options.scene, options.tokens) },
      [placesSource]: { type: "geojson", data: placeFeatures(options.scene, options.tokens) }
    },
    layers: [
      ...layers(basemapSource, basemapFlavor(options.tokens), { lang: options.locale }),
      ...overlayLayers(options)
    ]
  }
}

export { basemapStyle, basemapUrl, mapAssetsBase, placesLayer, placesSource, routesSource }
