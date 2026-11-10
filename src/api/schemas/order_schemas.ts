import * as v from "valibot"
import type { AttentionReturn } from "../../types/attention_return.type"
import type { AttentionSaga } from "../../types/attention_saga.type"
import type { OrderCompletion } from "../../types/order_completion.type"
import type { OrderDetail } from "../../types/order_detail.type"
import type { OrderPage } from "../../types/order_page.type"
import { countSchema } from "./count_schema"
import { instantSchema } from "./instant_schema"
import { orderStatuses } from "./order_statuses"

const uuidSchema = v.pipe(v.string(), v.uuid())

const textSchema = v.pipe(v.string(), v.minLength(1))

const amountSchema = v.pipe(v.number(), v.finite())

const orderStatusSchema = v.picklist(orderStatuses)

const lineSchema = v.object({
  id: uuidSchema,
  productId: textSchema,
  productTitle: v.string(),
  unitPrice: amountSchema,
  quantity: v.pipe(countSchema, v.minValue(1)),
  lineSubtotal: amountSchema
})

const orderSchema = v.object({
  id: uuidSchema,
  orderNumber: textSchema,
  customerPrincipalId: textSchema,
  merchantPrincipalId: textSchema,
  driverPrincipalId: v.nullable(textSchema),
  status: orderStatusSchema,
  subtotal: amountSchema,
  discountAmount: amountSchema,
  appliedVoucher: v.nullable(v.string()),
  finalTotal: amountSchema,
  shippingAddress: v.string(),
  shippingServiceTier: textSchema,
  baseShippingFee: amountSchema,
  shippingDiscount: amountSchema,
  finalShippingFee: amountSchema,
  distanceKm: v.pipe(v.number(), v.finite(), v.minValue(0)),
  shippingQuoteBasis: textSchema,
  createdAt: instantSchema,
  items: v.array(lineSchema)
}) satisfies v.GenericSchema<unknown, OrderDetail>

const orderSummarySchema = v.object({
  id: uuidSchema,
  orderNumber: textSchema,
  status: orderStatusSchema,
  customerPrincipalId: textSchema,
  merchantPrincipalId: textSchema,
  finalTotal: amountSchema,
  finalShippingFee: amountSchema,
  itemCount: countSchema,
  createdAt: instantSchema,
  updatedAt: instantSchema,
  deliveredAt: v.nullable(instantSchema),
  completedAt: v.nullable(instantSchema)
})

const orderPageSchema = v.object({
  orders: v.array(orderSummarySchema),
  nextCursor: v.nullable(textSchema)
}) satisfies v.GenericSchema<unknown, OrderPage>

const completionSchema = v.object({
  orderNumber: textSchema,
  escrowReleased: v.boolean(),
  detail: v.nullable(v.string())
}) satisfies v.GenericSchema<unknown, OrderCompletion>

const returnSchema = v.object({
  returnNumber: textSchema,
  orderNumber: textSchema,
  merchantPrincipalId: textSchema,
  status: v.picklist(["OPEN", "GOODS_RECEIVED", "RESOLVED", "REJECTED"]),
  reason: v.string(),
  openedAt: instantSchema,
  goodsReceivedAt: v.nullable(instantSchema),
  refundAmount: v.nullable(amountSchema),
  lastRefundError: v.nullable(v.string())
})

const returnListSchema = v.array(returnSchema) satisfies v.GenericSchema<unknown, AttentionReturn[]>

const stepSchema = v.object({
  name: v.picklist([
    "RedeemVoucher",
    "AllocateFlashSaleStock",
    "ReserveStock",
    "CreateEscrowHold",
    "CreateFulfillmentOrder"
  ]),
  reference: v.string(),
  quantity: countSchema,
  merchantPrincipalId: v.string(),
  productId: v.nullable(v.string()),
  state: v.picklist(["Attempting", "Done", "Failed", "Compensated"]),
  compensationAttempts: countSchema,
  lastFailureCode: v.nullable(v.string()),
  detail: v.nullable(v.string()),
  remedy: textSchema
})

const sagaSchema = v.object({
  sagaId: uuidSchema,
  orderNumber: textSchema,
  customerPrincipalId: v.string(),
  state: v.picklist(["Running", "Completed", "Compensating", "Compensated", "Stuck", "Abandoned"]),
  orderStatus: v.nullable(orderStatusSchema),
  compensationAttempts: countSchema,
  lastFailureCode: v.nullable(v.string()),
  failureReason: v.nullable(v.string()),
  correlationId: v.string(),
  abandonedAt: v.nullable(instantSchema),
  needsAttentionAt: v.nullable(instantSchema),
  updatedAt: instantSchema,
  unreleasedSteps: v.array(stepSchema)
})

const sagaListSchema = v.array(sagaSchema) satisfies v.GenericSchema<unknown, AttentionSaga[]>

export { completionSchema, orderPageSchema, orderSchema, returnListSchema, sagaListSchema }
