import type { FeatureCollection, LineString, Point } from "geojson"
import type { MapScene } from "../types/map_scene.type"
import type { MapTokens } from "../types/map_tokens.type"
import { placePaint } from "./place_paint"

function lngLat(point: { latitude: number; longitude: number }): [number, number] {
  return [point.longitude, point.latitude]
}

function placeFeatures(scene: MapScene, tokens: MapTokens): FeatureCollection<Point> {
  const ordered = [...scene.places].sort((a, b) => Number(a.selected) - Number(b.selected))

  return {
    type: "FeatureCollection",
    features: ordered.map((place) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: lngLat(place.point) },
      properties: { id: place.id, kind: place.kind, label: place.label, ...placePaint(place, tokens) }
    }))
  }
}

function routeFeatures(scene: MapScene, tokens: MapTokens): FeatureCollection<LineString> {
  return {
    type: "FeatureCollection",
    features: scene.routes.map((route) => ({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [lngLat(route.from), lngLat(route.to)] },
      properties: {
        id: route.id,
        color: route.selected ? tokens.accent : tokens.ink,
        width: route.selected ? 2.5 : 1.5
      }
    }))
  }
}

export { placeFeatures, routeFeatures }
