import type { DrawingModel } from "./drawing_model.type"

type CabinetModel = DrawingModel & {
  show: (drawers: readonly string[], selected: string | null) => void
}

export type { CabinetModel }
