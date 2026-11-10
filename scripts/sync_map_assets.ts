import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { mapAssetSources, mapAssets, mapAssetsRoot } from "./map_assets.ts"
import { mapAssetsVersion } from "./map_assets_version.ts"
import { sha256Hex } from "./sha256_hex.ts"
import type { MapAssetsLock } from "./types/map_assets_lock.type.ts"

function rawUrl(source: string, from: string): string {
  const origin = mapAssetSources[source]
  if (origin === undefined) {
    throw new Error(`no source named ${source}`)
  }

  const path = from.split("/").map(encodeURIComponent).join("/")

  return `https://raw.githubusercontent.com/${origin.repository}/${origin.commit}/${path}`
}

const fetched: Array<{ bytes: Buffer; entry: MapAssetsLock["files"][number] }> = []

for (const asset of mapAssets) {
  const response = await fetch(rawUrl(asset.source, asset.from))
  if (!response.ok) {
    throw new Error(`${asset.from}: HTTP ${response.status}`)
  }

  const bytes = Buffer.from(await response.arrayBuffer())

  fetched.push({ bytes, entry: { ...asset, sha256: sha256Hex(bytes) } })
  console.log(`${asset.source} ${asset.from} (${bytes.byteLength} bytes)`)
}

const files = fetched.map((item) => item.entry)
const version = mapAssetsVersion(files)

rmSync(mapAssetsRoot, { recursive: true, force: true })

for (const item of fetched) {
  const target = join(mapAssetsRoot, version, item.entry.path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, item.bytes)
}

const lock: MapAssetsLock = { version, sources: { ...mapAssetSources }, files }

writeFileSync("map_assets.lock.json", `${JSON.stringify(lock, null, 2)}\n`)
console.log(`${files.length} files in ${mapAssetsRoot}/${version}`)
