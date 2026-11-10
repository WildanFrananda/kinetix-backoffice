import type { MapPlace } from "../types/map_place.type"
import type { MapTokens } from "../types/map_tokens.type"
import type { PlacePaint } from "../types/place_paint.type"

function placePaint(place: MapPlace, tokens: MapTokens): PlacePaint {
  const radius = place.kind === "courier" ? 6 : 7
  const grown = place.selected ? radius + 2 : radius
  const ring = place.selected ? tokens.accent : tokens.ink

  if (place.kind === "pickup" || place.tone === "busy") {
    return { fill: tokens.paper, stroke: ring, strokeWidth: 2.5, radius: grown }
  }

  if (place.tone === "offline") {
    return { fill: place.selected ? tokens.accent : tokens.quiet, stroke: tokens.paper, strokeWidth: 2, radius: grown }
  }

  return { fill: place.selected ? tokens.accent : tokens.ink, stroke: tokens.paper, strokeWidth: 2, radius: grown }
}

export { placePaint }
