import type { DrawingModel } from "./drawing_model.type"

type SessionFuseModel = DrawingModel & {
  show: (minutesLeft: number) => void
}

export type { SessionFuseModel }
