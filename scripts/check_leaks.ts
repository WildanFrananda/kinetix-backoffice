import { existsSync, readdirSync, readFileSync } from "node:fs"
import { extname, join } from "node:path"
import { leakRules } from "./leak_rules.ts"

const denylist = process.env.KINETIX_DENYLIST

if (denylist === undefined) {
  throw new Error("KINETIX_DENYLIST is not set; set it to the denylist, or to an empty string on purpose")
}

const roots = ["src", "public", "scripts", "tests", "e2e", "nginx", "toolchain", "bin", ".github"]
const files = ["Dockerfile", "README.md", "CLAUDE.md", "package.json", ".gitlab-ci.yml", "shared.lock.json"]
const binary = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".woff", ".woff2"])
const rules = leakRules(denylist)

function listed(root: string): string[] {
  if (!existsSync(root)) {
    return []
  }
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
}

let scanned = 0
let flagged = 0

for (const path of [...roots.flatMap(listed), ...files.filter((file) => existsSync(file))]) {
  if (binary.has(extname(path).toLowerCase())) {
    continue
  }
  scanned += 1
  const text = readFileSync(path, "utf8")
  for (const rule of rules) {
    for (const match of text.matchAll(rule.pattern)) {
      if (!rule.permits(match[0])) {
        flagged += 1
        const line = text.slice(0, match.index).split("\n").length
        console.log(`${path}:${line} ${rule.name}`)
      }
    }
  }
}

if (flagged > 0) {
  console.error(`${flagged} potential leak(s) in ${scanned} files; matched text is withheld from this log`)
  process.exit(1)
}

console.log(`no leaks in ${scanned} files`)
