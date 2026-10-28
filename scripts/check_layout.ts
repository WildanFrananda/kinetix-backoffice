import { Glob } from "bun"
import { fixLayout, layoutProblems } from "./layout_rules"

const patterns = [
  "src/**/*.{ts,tsx}",
  "tests/**/*.{ts,tsx}",
  "scripts/**/*.ts",
  "e2e/**/*.ts",
  "*.config.ts",
  "public/theme.js"
]

const skipped = [/^src\/routeTree\.gen\.ts$/, /\.d\.css\.ts$/]

const fixing = process.argv.includes("--fix")

async function sources(): Promise<string[]> {
  const found = new Set<string>()

  for (const pattern of patterns) {
    for await (const path of new Glob(pattern).scan({ cwd: process.cwd(), onlyFiles: true })) {
      if (!skipped.some((rule) => rule.test(path))) {
        found.add(path)
      }
    }
  }

  return [...found].sort()
}

function settled(source: string, path: string): string {
  let current = source

  for (let pass = 0; pass < 5; pass += 1) {
    const problems = layoutProblems(current, path)
    if (problems.length === 0) {
      return current
    }

    current = fixLayout(current, problems)
  }

  return current
}

let reported = 0

for (const path of await sources()) {
  const source = await Bun.file(path).text()
  const problems = layoutProblems(source, path)
  if (problems.length === 0) {
    continue
  }

  reported += problems.length

  if (fixing) {
    await Bun.write(path, settled(source, path))
    continue
  }

  for (const problem of problems) {
    console.error(`${path}:${problem.line} ${problem.rule}`)
  }
}

if (reported > 0 && !fixing) {
  console.error(`layout: ${reported} place(s) are too compact or padded; run bun scripts/check_layout.ts --fix`)
  process.exit(1)
}

console.log(fixing ? `layout: fixed ${reported} place(s)` : "layout: every block is spaced as the house style asks")
