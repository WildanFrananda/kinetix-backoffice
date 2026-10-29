import { applicantProfileCall } from "../../src/api/calls/applicant_profile_call"
import { approveCourierCall } from "../../src/api/calls/approve_courier_call"
import { binStockCall } from "../../src/api/calls/bin_stock_call"
import { categoriesCall } from "../../src/api/calls/categories_call"
import { courierApplicationsCall } from "../../src/api/calls/courier_applications_call"
import { courierApplicationsTallyCall } from "../../src/api/calls/courier_applications_tally_call"
import { createCategoryCall } from "../../src/api/calls/create_category_call"
import { deleteCategoryCall } from "../../src/api/calls/delete_category_call"
import { dispatchSummaryCall } from "../../src/api/calls/dispatch_summary_call"
import { enableTwoFactorCall } from "../../src/api/calls/enable_two_factor_call"
import { loginCall } from "../../src/api/calls/login_call"
import { logoutCall } from "../../src/api/calls/logout_call"
import { meCall } from "../../src/api/calls/me_call"
import { pendingCourierApplicationsCall } from "../../src/api/calls/pending_courier_applications_call"
import { pendingSellerApplicationsCall } from "../../src/api/calls/pending_seller_applications_call"
import { productCall } from "../../src/api/calls/product_call"
import { rejectCourierCall } from "../../src/api/calls/reject_courier_call"
import { rejectSellerCall } from "../../src/api/calls/reject_seller_call"
import { returnsNeedingAttentionCall } from "../../src/api/calls/returns_needing_attention_call"
import { sagasNeedingAttentionCall } from "../../src/api/calls/sagas_needing_attention_call"
import { sellerApplicationsCall } from "../../src/api/calls/seller_applications_call"
import { sellerApplicationsTallyCall } from "../../src/api/calls/seller_applications_tally_call"
import { sessionCall } from "../../src/api/calls/session_call"
import { setupTwoFactorCall } from "../../src/api/calls/setup_two_factor_call"
import { stockAdjustmentsCall } from "../../src/api/calls/stock_adjustments_call"
import { stockMovementCall } from "../../src/api/calls/stock_movement_call"
import { stockReceiptsCall } from "../../src/api/calls/stock_receipts_call"
import { updateCategoryCall } from "../../src/api/calls/update_category_call"
import { upsertBinCall } from "../../src/api/calls/upsert_bin_call"
import { verifySellerCall } from "../../src/api/calls/verify_seller_call"
import { verifyTwoFactorCall } from "../../src/api/calls/verify_two_factor_call"
import { warehouseBinsCall } from "../../src/api/calls/warehouse_bins_call"
import type { BffCall } from "../../src/types/bff_call.type"

const backofficeCalls: ReadonlyArray<BffCall<unknown>> = [
  sessionCall,
  loginCall("admin@example.com", "correct horse"),
  verifyTwoFactorCall("123456"),
  setupTwoFactorCall,
  enableTwoFactorCall("123456"),
  logoutCall,
  meCall,
  dispatchSummaryCall,
  pendingSellerApplicationsCall,
  pendingCourierApplicationsCall,
  returnsNeedingAttentionCall,
  sagasNeedingAttentionCall,
  sellerApplicationsCall({ status: "pending", after: 40 }),
  verifySellerCall(57),
  rejectSellerCall(57),
  sellerApplicationsTallyCall(new Date(2026, 9, 29)),
  courierApplicationsCall({ status: "rejected", after: 0 }),
  approveCourierCall("3c9e2a41-7b5d-4f08-9a1c-2d6e8f0b4c17"),
  rejectCourierCall("3c9e2a41-7b5d-4f08-9a1c-2d6e8f0b4c17"),
  courierApplicationsTallyCall(new Date(2026, 9, 26)),
  applicantProfileCall(42),
  categoriesCall,
  createCategoryCall({ name: "Pakaian", slug: "pakaian" }),
  updateCategoryCall(3, { name: "Pakaian Pria", slug: "pakaian-pria" }),
  deleteCategoryCall(4),
  warehouseBinsCall("A-01-4"),
  binStockCall({ sku: "GAMIS-RED-M", binCode: "A-01-3" }, 204),
  stockReceiptsCall({ binCode: "A-01-3" }, 912),
  stockAdjustmentsCall({ sku: "GAMIS-RED-M" }, undefined),
  upsertBinCall({ code: "A-01-3", zone: "A", shelfLevel: 3 }),
  productCall("KAOS-HITAM-M"),
  stockMovementCall({
    kind: "receipt",
    binCode: "A-01-3",
    sku: "GAMIS-RED-M",
    merchantPrincipalId: "3f6c1a2e-8b4d-4e7f-9a1c-5d2e7b8f0a14",
    quantity: 24,
    note: "Inbound delivery, carton 2 of 3",
    idempotencyKey: "0b8f2c1e-6d4a-4f7b-9c2d-5a1e8f0b7c3d"
  }),
  stockMovementCall({
    kind: "adjustment",
    binCode: "A-01-3",
    sku: "GAMIS-RED-M",
    merchantPrincipalId: "3f6c1a2e-8b4d-4e7f-9a1c-5d2e7b8f0a14",
    delta: -2,
    reason: "DAMAGE",
    note: "Two units torn at the seam",
    idempotencyKey: "4d2a9e7c-1b3f-4a6e-8c5d-7f0e2b9a1c64"
  })
]

const otherAppOnly: Readonly<Record<string, string>> = {
  "rest.edge.login.case.session": "a password alone starts a session on the seller web only",
  "rest.edge.verifyTwoFactor.case.sessionSellerWeb": "the seller web's session; the backoffice admits only admins"
}

const sellerExamples: Readonly<Record<string, string>> = {
  "rest.edge.session.case.signedIn": "the documented example is a seller's session; on the backoffice it is an admin's"
}

export { backofficeCalls, otherAppOnly, sellerExamples }
