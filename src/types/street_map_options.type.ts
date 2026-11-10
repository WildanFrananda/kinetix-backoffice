import type { BasemapManifest } from "./basemap_manifest.type"
import type { Locale } from "./locale.type"
import type { MapScene } from "./map_scene.type"

type StreetMapOptions = {
  label: string
  basemap: BasemapManifest
  locale: Locale
  scene: MapScene
  reducedMotion: boolean
  onChoose: (id: string) => void
  onProblem: () => void
}

export type { StreetMapOptions }
