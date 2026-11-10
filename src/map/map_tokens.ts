import type { MapTokens } from "../types/map_tokens.type"

const tokenNames = {
  paper: "--kx-bg",
  ink: "--kx-fg",
  muted: "--kx-gray-2",
  faint: "--kx-gray-3",
  quiet: "--kx-gray-4",
  accent: "--kx-accent",
  water: "--kx-lane-a",
  green: "--kx-lane-b"
} as const satisfies Record<keyof MapTokens, string>

function mapTokensFrom(read: (name: string) => string): MapTokens {
  const entries = Object.entries(tokenNames).map(([key, name]) => [key, read(name).trim()])

  return Object.fromEntries(entries) as MapTokens
}

function readMapTokens(): MapTokens {
  const style = getComputedStyle(document.documentElement)

  return mapTokensFrom((name) => style.getPropertyValue(name))
}

export { mapTokensFrom, readMapTokens, tokenNames }
