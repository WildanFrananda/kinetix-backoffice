import type { SagaStepName } from "./saga_step_name.type"
import type { SagaStepState } from "./saga_step_state.type"

type SagaStep = {
  name: SagaStepName
  reference: string
  quantity: number
  merchantPrincipalId: string
  productId: string | null
  state: SagaStepState
  compensationAttempts: number
  lastFailureCode: string | null
  detail: string | null
  remedy: string
}

export type { SagaStep }
