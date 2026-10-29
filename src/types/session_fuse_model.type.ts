import type { DrawingModel } from "./drawing_model.type"

type SessionFuseModel = DrawingModel & {
  show: (minutesLeft: number, placed?: boolean) => void
}

export type { SessionFuseModel }
