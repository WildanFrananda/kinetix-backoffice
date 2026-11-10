import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { mapAssetSources, mapAssets, mapAssetsRoot } from "../../scripts/map_assets"
import { mapAssetsVersion } from "../../scripts/map_assets_version"
import { sha256Hex } from "../../scripts/sha256_hex"
import type { MapAssetsLock } from "../../scripts/types/map_assets_lock.type"

const lock = JSON.parse(readFileSync("map_assets.lock.json", "utf8")) as MapAssetsLock

function listed(root: string): string[] {
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
}

describe("the map's glyphs and sprites", () => {
  it("are exactly the files the sync copies, from the pinned commits", () => {
    expect(lock.sources).toEqual(mapAssetSources)
    expect(lock.files.map((file) => ({ path: file.path, source: file.source, from: file.from }))).toEqual([
      ...mapAssets
    ])
  })

  it("sit in a directory named after their content, so they can be cached for good", () => {
    expect(lock.version).toBe(mapAssetsVersion(lock.files))
    expect(readdirSync(mapAssetsRoot)).toEqual([lock.version])
  })

  it("are unchanged since the sync, and nothing else is there", () => {
    for (const file of lock.files) {
      const path = join(mapAssetsRoot, lock.version, file.path)
      expect(existsSync(path), path).toBe(true)
      expect(sha256Hex(readFileSync(path)), path).toBe(file.sha256)
    }

    expect(listed(join(mapAssetsRoot, lock.version)).length).toBe(lock.files.length)
  })
})
