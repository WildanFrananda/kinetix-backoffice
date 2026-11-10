import type { OrderStatus } from "./order_status.type"
import type { SagaState } from "./saga_state.type"
import type { SagaStep } from "./saga_step.type"

type AttentionSaga = {
  sagaId: string
  orderNumber: string
  customerPrincipalId: string
  state: SagaState
  orderStatus: OrderStatus | null
  compensationAttempts: number
  lastFailureCode: string | null
  failureReason: string | null
  correlationId: string
  abandonedAt: Date | null
  needsAttentionAt: Date | null
  updatedAt: Date
  unreleasedSteps: readonly SagaStep[]
}

export type { AttentionSaga }
