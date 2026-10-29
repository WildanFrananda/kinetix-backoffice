import type { DecisionKind } from "./decision_kind.type"

type PendingDecision<Application> = {
  kind: DecisionKind
  application: Application
}

export type { PendingDecision }
