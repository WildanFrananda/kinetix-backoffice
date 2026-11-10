import { addProtocol, type GeoJSONSource, LngLatBounds, Map as MapLibreMap, setWorkerUrl } from "maplibre-gl"
import workerAsset from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url"
import { PMTiles, Protocol } from "pmtiles"
import type { GeoPoint } from "../types/geo_point.type"
import type { Locale } from "../types/locale.type"
import type { MapScene } from "../types/map_scene.type"
import type { StreetMapHandle } from "../types/street_map_handle.type"
import type { StreetMapOptions } from "../types/street_map_options.type"
import { basemapStyle, basemapUrl, mapAssetsBase, placesLayer, placesSource, routesSource } from "./basemap_style"
import { readMapTokens } from "./map_tokens"
import { placeFeatures, routeFeatures } from "./scene_features"
import { admitWorker } from "./worker_policy"

const protocol = new Protocol()

let protocolAdded = false

function addTilesProtocol(origin: string): void {
  if (!protocolAdded) {
    addProtocol("pmtiles", protocol.tile)
    protocolAdded = true
  }

  const url = basemapUrl(origin).slice("pmtiles://".length)
  if (protocol.get(url) === undefined) {
    protocol.add(new PMTiles(url))
  }
}

function darkTheme(): boolean {
  return document.documentElement.dataset.theme === "dark"
}

function mountStreetMap(container: HTMLElement, options: StreetMapOptions): StreetMapHandle {
  const origin = window.location.origin
  const worker = new URL(workerAsset, origin).href

  admitWorker(worker)
  setWorkerUrl(worker)

  addTilesProtocol(origin)

  const [west, south, east, north] = options.basemap.bounds
  const area = new LngLatBounds([west, south], [east, north])
  const margin = Math.max(east - west, north - south) * 0.25
  let reach = new LngLatBounds([west - margin, south - margin], [east + margin, north + margin])
  let scene: MapScene = options.scene
  let locale: Locale = options.locale
  let loaded = false
  let restyle = false

  function style() {
    return basemapStyle({
      origin,
      assets: mapAssetsBase(origin),
      basemap: options.basemap,
      tokens: readMapTokens(),
      dark: darkTheme(),
      locale,
      scene
    })
  }

  const map = new MapLibreMap({
    container,
    style: style(),
    bounds: area,
    maxBounds: reach,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    maxZoom: 18,
    fadeDuration: options.reducedMotion ? 0 : 300,
    locale: { "Map.Title": options.label }
  })

  map.touchZoomRotate.disableRotation()
  map.keyboard.disableRotation()

  function applyStyle(): void {
    if (!loaded) {
      restyle = true

      return
    }

    map.setStyle(style(), { diff: true })
  }

  function applyScene(): void {
    if (!loaded) {
      return
    }

    const tokens = readMapTokens()
    const places = map.getSource<GeoJSONSource>(placesSource)
    const routes = map.getSource<GeoJSONSource>(routesSource)

    places?.setData(placeFeatures(scene, tokens))
    routes?.setData(routeFeatures(scene, tokens))
  }

  map.on("style.load", () => {
    loaded = true

    if (restyle) {
      restyle = false
      map.setStyle(style(), { diff: true })
    }

    applyScene()
  })

  map.on("error", () => options.onProblem())

  map.on("click", placesLayer, (event) => {
    const id = event.features?.[0]?.properties?.id
    if (typeof id === "string") {
      options.onChoose(id)
    }
  })

  map.on("mouseenter", placesLayer, () => {
    map.getCanvas().style.cursor = "pointer"
  })

  map.on("mouseleave", placesLayer, () => {
    map.getCanvas().style.cursor = ""
  })

  const theme = new MutationObserver(applyStyle)
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

  function admit(points: readonly GeoPoint[]): void {
    const outside = points.filter((point) => !reach.contains([point.longitude, point.latitude]))
    if (outside.length === 0) {
      return
    }

    const wider = new LngLatBounds(reach.getSouthWest(), reach.getNorthEast())

    for (const point of outside) {
      wider.extend([point.longitude + margin, point.latitude + margin])
      wider.extend([point.longitude - margin, point.latitude - margin])
    }

    reach = wider
    map.setMaxBounds(reach)
  }

  function frame(points: readonly GeoPoint[]): void {
    const duration = options.reducedMotion ? 0 : 600
    const [first] = points

    admit(points)

    if (first === undefined) {
      map.fitBounds(area, { padding: 24, duration })

      return
    }

    if (points.length === 1) {
      map.easeTo({ center: [first.longitude, first.latitude], zoom: Math.max(map.getZoom(), 14), duration })

      return
    }

    const bounds = new LngLatBounds()

    for (const point of points) {
      bounds.extend([point.longitude, point.latitude])
    }

    map.fitBounds(bounds, { padding: 56, maxZoom: 16, duration })
  }

  return {
    show(next: MapScene): void {
      scene = next
      applyScene()
    },
    frame,
    setLocale(next: Locale): void {
      locale = next
      applyStyle()
    },
    zoom(by: number): void {
      map.easeTo({ zoom: map.getZoom() + by, duration: options.reducedMotion ? 0 : 250 })
    },
    resize(): void {
      map.resize()
    },
    dispose(): void {
      theme.disconnect()
      map.remove()
    }
  }
}

export { mountStreetMap }
