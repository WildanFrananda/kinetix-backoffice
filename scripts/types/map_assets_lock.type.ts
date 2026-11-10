import type { MapAssetSource } from "./map_asset_source.type.ts"

type MapAssetsLock = {
  version: string
  sources: Record<string, MapAssetSource>
  files: Array<{
    path: string
    source: string
    from: string
    sha256: string
  }>
}

export type { MapAssetsLock }
