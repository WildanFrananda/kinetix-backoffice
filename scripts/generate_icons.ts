import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import type { IconWeight } from "@phosphor-icons/react"
import type { ReactElement } from "react"
import { iconSet } from "./icon_set.ts"
import { iconSource } from "./icon_source.ts"

const directory = "src/ui/icons"

const definitions = "../node_modules/@phosphor-icons/react/dist/defs"

mkdirSync(directory, { recursive: true })

const wanted = new Set(Object.keys(iconSet).map((name) => `${name}.tsx`))

for (const file of readdirSync(directory)) {
  if (!wanted.has(file)) {
    rmSync(`${directory}/${file}`)
    console.log(`removed ${file}`)
  }
}

for (const [name, weights] of Object.entries(iconSet)) {
  const module = (await import(new URL(`${definitions}/${name}.es.js`, import.meta.url).href)) as {
    default: ReadonlyMap<IconWeight, ReactElement>
  }

  const chosen = weights.map((weight): readonly [IconWeight, ReactElement] => {
    const element = module.default.get(weight)
    if (element === undefined) {
      throw new Error(`Phosphor has no ${weight} weight of ${name}`)
    }

    return [weight, element]
  })

  writeFileSync(`${directory}/${name}.tsx`, iconSource(name, chosen))
}

const formatted = Bun.spawnSync(["bunx", "biome", "format", "--write", directory], {
  stdout: "inherit",
  stderr: "inherit"
})

if (formatted.exitCode !== 0) {
  throw new Error("biome could not format the generated icons")
}

console.log(`wrote ${wanted.size} icons to ${directory}`)
