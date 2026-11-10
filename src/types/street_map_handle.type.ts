import type { GeoPoint } from "./geo_point.type"
import type { Locale } from "./locale.type"
import type { MapScene } from "./map_scene.type"

type StreetMapHandle = {
  show: (scene: MapScene) => void
  frame: (points: readonly GeoPoint[]) => void
  setLocale: (locale: Locale) => void
  zoom: (by: number) => void
  resize: () => void
  dispose: () => void
}

export type { StreetMapHandle }
