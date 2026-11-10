import { sha256Hex } from "./sha256_hex.ts"

function mapAssetsVersion(files: ReadonlyArray<{ path: string; sha256: string }>): string {
  const listing = [...files]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((file) => `${file.sha256}  ${file.path}\n`)
    .join("")

  return sha256Hex(listing).slice(0, 12)
}

export { mapAssetsVersion }
