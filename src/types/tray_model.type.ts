import type { DecisionOutcome } from "./decision_outcome.type"
import type { DrawingModel } from "./drawing_model.type"
import type { TrayState } from "./tray_state.type"

type TrayModel = DrawingModel & {
  show: (state: TrayState) => void
  decide: (id: string, outcome: DecisionOutcome) => void
}

export type { TrayModel }
