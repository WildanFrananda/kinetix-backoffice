import type { DrawingModel } from "./drawing_model.type"
import type { RackBin } from "./rack_bin.type"

type BinRackModel = DrawingModel & {
  show: (bins: readonly RackBin[], selected: string | null) => void
}

export type { BinRackModel }
