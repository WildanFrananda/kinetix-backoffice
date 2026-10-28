import { gzipSync } from "bun"
import type { BundleFile } from "./types/bundle_file.type"

const budgetBytes = 200 * 1024

const lazyOnly = ["WebGLRenderer"]

const client = "dist/client"

const html = await Bun.file(`${client}/index.html`).text()

const initial = [...html.matchAll(/<(?:script[^>]*\ssrc|link[^>]*rel="modulepreload"[^>]*\shref)="([^"]+\.js)"/g)]
  .map((match) => match[1] ?? "")
  .filter((path) => path.length > 0)

const sizes: BundleFile[] = []

for (const path of new Set(initial)) {
  const text = await Bun.file(`${client}${path}`).text()
  sizes.push({ path, bytes: gzipSync(text).byteLength, text })
}

const total = sizes.reduce((sum, file) => sum + file.bytes, 0)
const leaked = sizes.filter((file) => lazyOnly.some((marker) => file.text.includes(marker)))

for (const file of sizes.sort((a, b) => b.bytes - a.bytes)) {
  console.log(`${(file.bytes / 1024).toFixed(1).padStart(7)} KiB  ${file.path}`)
}

console.log(`${(total / 1024).toFixed(1).padStart(7)} KiB  initial JavaScript, gzip (budget ${budgetBytes / 1024} KiB)`)

if (leaked.length > 0) {
  console.error(`the 3D engine reached the initial load: ${leaked.map((file) => file.path).join(", ")}`)
  process.exit(1)
}

if (total > budgetBytes) {
  console.error("initial JavaScript is over budget: split a route or load a heavy part on demand")
  process.exit(1)
}
