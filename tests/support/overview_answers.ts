function dispatchSummary() {
  return { data: { pending: 3, active: 11, delivered_today: 42 } }
}

function sellerPage(count: number, nextAfterId: number | null) {
  return {
    applications: Array.from({ length: count }, (_, index) => ({ applicationId: index + 1, status: "pending" })),
    nextAfterId
  }
}

function courierPage(filed: readonly string[]) {
  return {
    applications: filed.map((filedAt, index) => ({ applicationId: index + 1, status: "pending", filedAt })),
    nextAfterId: null
  }
}

function attentionReturns() {
  return [
    {
      returnNumber: "RMA-20261019-4B8D2E6A",
      orderNumber: "ORD-20261015-2C9E7A41",
      status: "OPEN",
      reason: "Kemasan bocor saat diterima",
      openedAt: "2026-10-19T08:42:11.204517Z",
      lastRefundError: null
    },
    {
      returnNumber: "RMA-20261020-9A1C3E5F",
      orderNumber: "ORD-20261016-6D2B8F03",
      status: "GOODS_RECEIVED",
      reason: "Barang tidak sesuai pesanan",
      openedAt: "2026-10-20T02:10:45.918362Z",
      lastRefundError: "payment held nothing to refund goods from"
    }
  ]
}

export { attentionReturns, courierPage, dispatchSummary, sellerPage }
