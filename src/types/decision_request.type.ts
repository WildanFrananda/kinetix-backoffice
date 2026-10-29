import type { DecisionKind } from "./decision_kind.type"

type DecisionRequest = {
  kind: DecisionKind
  id: number
  name: string
}

export type { DecisionRequest }
