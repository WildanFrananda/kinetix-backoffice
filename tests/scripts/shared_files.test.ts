import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { sha256Hex } from "../../scripts/sha256_hex.ts"
import { sharedFiles, sharedSource } from "../../scripts/shared_files.ts"
import type { SharedLock } from "../../scripts/types/shared_lock.type.ts"

const lock = JSON.parse(readFileSync("shared.lock.json", "utf8")) as SharedLock

describe("files shared with kinetix-docs", () => {
  it("are exactly the ones the sync copies", () => {
    expect(lock.source).toBe(sharedSource)
    expect(lock.files.map((file) => ({ path: file.path, from: file.from }))).toEqual([...sharedFiles])
  })

  it("are unchanged since the sync: edit them in kinetix-docs, then sync", () => {
    for (const file of lock.files) {
      expect(sha256Hex(readFileSync(file.path)), file.path).toBe(file.sha256)
    }
  })
})
