import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { sha256Hex } from "./sha256_hex.ts"
import { sharedFiles, sharedSource } from "./shared_files.ts"
import type { SharedLock } from "./types/shared_lock.type.ts"

const docsDirectory = process.env.KINETIX_DOCS_DIR

if (docsDirectory === undefined || docsDirectory.length === 0) {
  throw new Error("KINETIX_DOCS_DIR must name a checkout of kinetix-docs")
}

const lock: SharedLock = { source: sharedSource, files: [] }

for (const file of sharedFiles) {
  mkdirSync(dirname(file.path), { recursive: true })
  copyFileSync(join(docsDirectory, file.from), file.path)
  lock.files.push({ path: file.path, from: file.from, sha256: sha256Hex(readFileSync(file.path)) })
  console.log(`copied ${file.from} -> ${file.path}`)
}

writeFileSync("shared.lock.json", `${JSON.stringify(lock, null, 2)}\n`)
