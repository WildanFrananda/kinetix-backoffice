import { readFileSync } from "node:fs"
import { mapTokensFrom } from "../../src/map/map_tokens"
import type { MapTokens } from "../../src/types/map_tokens.type"

function block(css: string, selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf("}", start))

  return new Map([...body.matchAll(/(--kx-[\w-]+):\s*([^;]+);/g)].map((match) => [match[1] ?? "", match[2] ?? ""]))
}

function themeTokens(theme: "light" | "dark"): MapTokens {
  const css = readFileSync("src/styles/kx-tokens.css", "utf8")
  const dark = block(css, ":root")
  const light = block(css, ':root[data-theme="light"]')

  return mapTokensFrom((name) => (theme === "light" ? (light.get(name) ?? dark.get(name)) : dark.get(name)) ?? "")
}

export { themeTokens }
