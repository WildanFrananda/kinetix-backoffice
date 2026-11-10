import type { MapPlace } from "./map_place.type"
import type { MapRoute } from "./map_route.type"

type MapScene = {
  places: readonly MapPlace[]
  routes: readonly MapRoute[]
}

export type { MapScene }
