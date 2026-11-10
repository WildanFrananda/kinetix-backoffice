import type { BasemapManifest } from "./basemap_manifest.type"
import type { Locale } from "./locale.type"
import type { MapScene } from "./map_scene.type"
import type { MapTokens } from "./map_tokens.type"

type BasemapStyleOptions = {
  origin: string
  assets: string
  basemap: Pick<BasemapManifest, "bounds" | "maxZoom">
  tokens: MapTokens
  dark: boolean
  locale: Locale
  scene: MapScene
}

export type { BasemapStyleOptions }
