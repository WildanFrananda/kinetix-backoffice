import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import type { Icon } from "@phosphor-icons/react"
import * as phosphor from "@phosphor-icons/react"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { iconSet } from "../../scripts/icon_set.ts"

const shared: ReadonlySet<string> = new Set([
  "IconBase",
  "IconContext",
  "type Icon",
  "type IconProps",
  "type IconWeight"
])

function sourcesUnder(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      return path === join("src", "ui", "icons") ? [] : sourcesUnder(path)
    }

    return /\.tsx?$/.test(entry.name) ? [path] : []
  })
}

describe("the icons", () => {
  it("are exactly the generated set", () => {
    const files = readdirSync("src/ui/icons").sort()

    expect(files).toEqual(
      Object.keys(iconSet)
        .map((name) => `${name}.tsx`)
        .sort()
    )
  })

  for (const [name, weights] of Object.entries(iconSet)) {
    for (const weight of weights) {
      it(`draws ${name} in ${weight} exactly as Phosphor does`, async () => {
        const file = join(process.cwd(), "src", "ui", "icons", `${name}.tsx`)
        const generated = ((await import(/* @vite-ignore */ file)) as Record<string, Icon>)[name]
        const original = (phosphor as unknown as Record<string, Icon>)[name]

        expect(generated).toBeDefined()
        expect(original).toBeDefined()

        if (generated === undefined || original === undefined) {
          return
        }

        const drawn = renderToStaticMarkup(createElement(generated, { weight, size: 18 }))

        expect(drawn).toContain("<path")
        expect(drawn).toBe(renderToStaticMarkup(createElement(original, { weight, size: 18 })))
      })
    }
  }

  it("come from src/ui/icons everywhere, never as Phosphor's six-weight components", () => {
    const offenders = sourcesUnder("src").flatMap((path) => {
      const imports = readFileSync(path, "utf8").matchAll(/import \{([^}]*)\} from "@phosphor-icons\/react"/g)

      return [...imports].flatMap((match) =>
        (match[1] ?? "")
          .split(",")
          .map((name) => name.trim())
          .filter((name) => name.length > 0 && !shared.has(name))
          .map((name) => `${path}: ${name}`)
      )
    })

    expect(offenders).toEqual([])
  })
})
