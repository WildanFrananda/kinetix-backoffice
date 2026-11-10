type SagaStepName =
  | "RedeemVoucher"
  | "AllocateFlashSaleStock"
  | "ReserveStock"
  | "CreateEscrowHold"
  | "CreateFulfillmentOrder"

export type { SagaStepName }
