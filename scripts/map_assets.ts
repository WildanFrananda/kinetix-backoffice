import type { MapAsset } from "./types/map_asset.type.ts"
import type { MapAssetSource } from "./types/map_asset_source.type.ts"

const mapAssetSources: Readonly<Record<string, MapAssetSource>> = {
  "basemaps-assets": { repository: "protomaps/basemaps-assets", commit: "028c18f713baecad011301ff7a69acc39bcc2ae7" },
  "tangrams-icons": { repository: "tangrams/icons", commit: "92510779634f4a006c61ea70e50cb8c52c765a81" }
}

const glyphRanges: Readonly<Record<string, readonly string[]>> = {
  "Noto Sans Regular": ["0-255", "256-511", "1536-1791", "8192-8447"],
  "Noto Sans Medium": ["0-255", "256-511", "8192-8447"],
  "Noto Sans Italic": ["0-255", "256-511", "8192-8447"]
}

const sprites = ["grayscale", "black"]

function glyphAssets(): MapAsset[] {
  return Object.entries(glyphRanges).flatMap(([font, ranges]) =>
    ranges.map((range) => ({
      path: `fonts/${font}/${range}.pbf`,
      source: "basemaps-assets",
      from: `fonts/${font}/${range}.pbf`
    }))
  )
}

function spriteAssets(): MapAsset[] {
  return sprites.flatMap((sprite) =>
    [`${sprite}.json`, `${sprite}.png`, `${sprite}@2x.json`, `${sprite}@2x.png`].map((file) => ({
      path: `sprites/${file}`,
      source: "basemaps-assets",
      from: `sprites/v4/${file}`
    }))
  )
}

const mapAssets: readonly MapAsset[] = [
  ...glyphAssets(),
  { path: "fonts/OFL.txt", source: "basemaps-assets", from: "fonts/OFL.txt" },
  ...spriteAssets(),
  { path: "sprites/LICENSE.md", source: "tangrams-icons", from: "LICENSE.md" }
]

const mapAssetsRoot = "public/map"

export { glyphRanges, mapAssetSources, mapAssets, mapAssetsRoot }
