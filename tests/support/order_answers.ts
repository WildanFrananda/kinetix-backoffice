const buyer = "4c2e8a71-5b3d-4f6e-9a1c-7d8e2f3b4a50"

const merchant = "a3d5f7b9-2c4e-4a6b-8d0f-1e3a5c7b9d21"

const courier = "e7b1c3d5-9f2a-4b6c-8e0d-3a5c7e9b1d42"

const deliveredId = "0b6d3c2e-8f1a-4c5d-9e2b-1a2b3c4d5e6f"

const paidId = "7c1e9a3b-2d4f-4e6a-8b0c-5d7e9f1a3b52"

const returnedId = "3e5a7c9b-1d3f-4a5b-8c7d-9e1f3a5b7c94"

type OrderRow = {
  id: string
  orderNumber: string
  status: string
  customerPrincipalId: string
  merchantPrincipalId: string
  finalTotal: number
  finalShippingFee: number
  itemCount: number
  createdAt: string
  updatedAt: string
  deliveredAt: string | null
  completedAt: string | null
}

const deliveredRow: OrderRow = {
  id: deliveredId,
  orderNumber: "ORD-20261022-7F3A9C1B",
  status: "DELIVERED",
  customerPrincipalId: buyer,
  merchantPrincipalId: merchant,
  finalTotal: 193800,
  finalShippingFee: 12000,
  itemCount: 2,
  createdAt: "2026-10-22T03:15:07.482913Z",
  updatedAt: "2026-10-23T09:40:12.118204Z",
  deliveredAt: "2026-10-23T09:40:12.118204Z",
  completedAt: null
}

const paidRow: OrderRow = {
  id: paidId,
  orderNumber: "ORD-20261021-2B4D6F80",
  status: "PAID",
  customerPrincipalId: buyer,
  merchantPrincipalId: merchant,
  finalTotal: 97000,
  finalShippingFee: 12000,
  itemCount: 1,
  createdAt: "2026-10-21T11:02:44.70233Z",
  updatedAt: "2026-10-21T11:02:51.30112Z",
  deliveredAt: null,
  completedAt: null
}

const returnedRow: OrderRow = {
  id: returnedId,
  orderNumber: "ORD-20261015-2C9E7A41",
  status: "DELIVERED",
  customerPrincipalId: buyer,
  merchantPrincipalId: merchant,
  finalTotal: 182000,
  finalShippingFee: 12000,
  itemCount: 2,
  createdAt: "2026-10-15T07:21:09.5521Z",
  updatedAt: "2026-10-17T02:48:30.1004Z",
  deliveredAt: "2026-10-17T02:48:30.1004Z",
  completedAt: null
}

function orderDetail(row: OrderRow, status: string = row.status) {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    customerPrincipalId: buyer,
    merchantPrincipalId: merchant,
    driverPrincipalId: row.deliveredAt === null ? null : courier,
    status,
    subtotal: 202000,
    discountAmount: 20200,
    appliedVoucher: "HEMAT10",
    finalTotal: row.finalTotal,
    shippingAddress: "Jl. Contoh Raya No. 12, Menteng, Jakarta Pusat 10310",
    shippingServiceTier: "KINETIX_REGULAR",
    baseShippingFee: 12000,
    shippingDiscount: 0,
    finalShippingFee: row.finalShippingFee,
    distanceKm: 7.42,
    shippingQuoteBasis: "DISTANCE_QUOTED",
    createdAt: row.createdAt,
    items: [
      {
        id: "5e8a2c4f-7b1d-4e3a-9c6f-2d4b8e1a7c30",
        productId: "KOPI-ARABIKA-250",
        productTitle: "Kopi Arabika Gayo 250 g",
        unitPrice: 85000,
        quantity: 2,
        lineSubtotal: 170000
      },
      {
        id: "9c3e5a7b-1d2f-4b6e-8a0c-4e6a8c2e0b51",
        productId: "GULA-AREN-500",
        productTitle: "Gula Aren Cair 500 ml",
        unitPrice: 32000,
        quantity: 1,
        lineSubtotal: 32000
      }
    ]
  }
}

const openReturn = {
  returnNumber: "RMA-20261019-4B8D2E6A",
  orderNumber: "ORD-20261015-2C9E7A41",
  merchantPrincipalId: merchant,
  status: "OPEN",
  reason: "Kemasan bocor saat diterima",
  openedAt: "2026-10-19T08:42:11.204517Z",
  goodsReceivedAt: null,
  refundAmount: null,
  lastRefundError: null
}

const stuckReturn = {
  returnNumber: "RMA-20261020-9A1C3E5F",
  orderNumber: "ORD-20261016-6D2B8F03",
  merchantPrincipalId: merchant,
  status: "GOODS_RECEIVED",
  reason: "Barang tidak sesuai pesanan",
  openedAt: "2026-10-20T02:10:45.918362Z",
  goodsReceivedAt: "2026-10-21T06:30:00Z",
  refundAmount: 85000,
  lastRefundError: "payment held nothing to refund goods from"
}

const abandonedSaga = {
  sagaId: "2f4a6c8e-0b1d-4f3a-8c5e-7a9b1c3d5e70",
  orderNumber: "ORD-20261021-3E5A7C9B",
  customerPrincipalId: buyer,
  state: "Abandoned",
  orderStatus: "CANCELLED",
  compensationAttempts: 6,
  lastFailureCode: "ESCROW_REFUND_UNCONFIRMED",
  failureReason: "a service this checkout depends on did not answer",
  correlationId: "8a2d4f6b-1c3e-4a5b-9d7f-0e2c4a6b8d91",
  abandonedAt: "2026-10-21T09:47:30.551204Z",
  needsAttentionAt: "2026-10-21T09:47:30.551204Z",
  updatedAt: "2026-10-21T09:47:30.551204Z",
  unreleasedSteps: [
    {
      name: "CreateEscrowHold",
      reference: "ORD-20261021-3E5A7C9B",
      quantity: 1,
      merchantPrincipalId: merchant,
      productId: null,
      state: "Attempting",
      compensationAttempts: 6,
      lastFailureCode: "ESCROW_REFUND_UNCONFIRMED",
      detail:
        "a refund was dispatched and did not answer, and payment still reports the hold as HELD; it is sent again next round under the same idempotency key",
      remedy:
        "payment.v1.PaymentService/RefundEscrow with idempotency_key 'order:<order number>' — payment dedupes on that key and answers already_applied, so repeating it cannot credit twice. Read GetEscrowStatus first to see what it will do: RELEASED means the merchant has been paid and no refund can undo it from here"
    }
  ]
}

const flaggedSaga = {
  sagaId: "6b8d0f2a-4c6e-4a8b-9d1f-3e5a7c9b1d24",
  orderNumber: "ORD-20260917-E4C9664A",
  customerPrincipalId: buyer,
  state: "Completed",
  orderStatus: "PENDING_PAYMENT",
  compensationAttempts: 0,
  lastFailureCode: "COMPLETED_WITHOUT_FULFILLMENT",
  failureReason: "the saga completed without creating a warehouse task",
  correlationId: "1c3e5a7b-9d2f-4b6a-8c0e-2a4c6e8a0b13",
  abandonedAt: null,
  needsAttentionAt: "2026-10-20T04:12:09.31Z",
  updatedAt: "2026-10-20T04:12:09.31Z",
  unreleasedSteps: [
    {
      name: "ReserveStock",
      reference: "KOPI-ARABIKA-250",
      quantity: 2,
      merchantPrincipalId: merchant,
      productId: "KOPI-ARABIKA-250",
      state: "Done",
      compensationAttempts: 0,
      lastFailureCode: null,
      detail: null,
      remedy: "fulfillment.v1.BinStockService/ReleaseStock with this merchant, sku and order number"
    }
  ]
}

function refusal(status: number, error: string, message: string): Response {
  return Response.json({ error, message }, { status })
}

export {
  abandonedSaga,
  deliveredId,
  deliveredRow,
  flaggedSaga,
  merchant,
  type OrderRow,
  openReturn,
  orderDetail,
  paidId,
  paidRow,
  refusal,
  returnedId,
  returnedRow,
  stuckReturn
}
