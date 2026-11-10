import type { GeoPoint } from "./geo_point.type"
import type { GridLine } from "./grid_line.type"
import type { ScaleBar } from "./scale_bar.type"
import type { ScreenPoint } from "./screen_point.type"

type PlaneView = {
  width: number
  height: number
  project: (point: GeoPoint) => ScreenPoint
  grid: GridLine[]
  scale: ScaleBar
}

export type { PlaneView }
