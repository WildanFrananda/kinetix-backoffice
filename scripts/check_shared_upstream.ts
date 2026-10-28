import { readFileSync } from "node:fs"
import { sha256Hex } from "./sha256_hex.ts"
import type { SharedLock } from "./types/shared_lock.type.ts"

const reference = process.env.KINETIX_DOCS_REF

if (reference === undefined || reference.length === 0) {
  throw new Error("KINETIX_DOCS_REF must name the kinetix-docs branch or commit to compare with")
}

const lock = JSON.parse(readFileSync("shared.lock.json", "utf8")) as SharedLock
let drifted = 0

for (const file of lock.files) {
  const url = `https://raw.githubusercontent.com/${lock.source}/${reference}/${file.from}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`)
  }
  const upstream = sha256Hex(Buffer.from(await response.arrayBuffer()))
  if (upstream !== file.sha256) {
    drifted += 1
    console.log(`${file.path} differs from ${lock.source}@${reference}:${file.from}; run scripts/sync_shared.ts`)
  }
}

if (drifted > 0) {
  process.exit(1)
}

console.log(`${lock.files.length} shared files equal ${lock.source}@${reference}`)
