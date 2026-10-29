import { applicantProfileCall } from "../../src/api/calls/applicant_profile_call"
import { approveCourierCall } from "../../src/api/calls/approve_courier_call"
import { courierApplicationsCall } from "../../src/api/calls/courier_applications_call"
import { courierApplicationsTallyCall } from "../../src/api/calls/courier_applications_tally_call"
import { dispatchSummaryCall } from "../../src/api/calls/dispatch_summary_call"
import { enableTwoFactorCall } from "../../src/api/calls/enable_two_factor_call"
import { loginCall } from "../../src/api/calls/login_call"
import { logoutCall } from "../../src/api/calls/logout_call"
import { meCall } from "../../src/api/calls/me_call"
import { pendingCourierApplicationsCall } from "../../src/api/calls/pending_courier_applications_call"
import { pendingSellerApplicationsCall } from "../../src/api/calls/pending_seller_applications_call"
import { rejectCourierCall } from "../../src/api/calls/reject_courier_call"
import { rejectSellerCall } from "../../src/api/calls/reject_seller_call"
import { returnsNeedingAttentionCall } from "../../src/api/calls/returns_needing_attention_call"
import { sagasNeedingAttentionCall } from "../../src/api/calls/sagas_needing_attention_call"
import { sellerApplicationsCall } from "../../src/api/calls/seller_applications_call"
import { sellerApplicationsTallyCall } from "../../src/api/calls/seller_applications_tally_call"
import { sessionCall } from "../../src/api/calls/session_call"
import { setupTwoFactorCall } from "../../src/api/calls/setup_two_factor_call"
import { verifySellerCall } from "../../src/api/calls/verify_seller_call"
import { verifyTwoFactorCall } from "../../src/api/calls/verify_two_factor_call"
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
  applicantProfileCall(42)
]

const otherAppOnly: Readonly<Record<string, string>> = {
  "rest.edge.login.case.session": "a password alone starts a session on the seller web only",
  "rest.edge.verifyTwoFactor.case.sessionSellerWeb": "the seller web's session; the backoffice admits only admins"
}

const sellerExamples: Readonly<Record<string, string>> = {
  "rest.edge.session.case.signedIn": "the documented example is a seller's session; on the backoffice it is an admin's"
}

export { backofficeCalls, otherAppOnly, sellerExamples }
