import { dispatchSummaryCall } from "../../src/api/calls/dispatch_summary_call"
import { enableTwoFactorCall } from "../../src/api/calls/enable_two_factor_call"
import { loginCall } from "../../src/api/calls/login_call"
import { logoutCall } from "../../src/api/calls/logout_call"
import { meCall } from "../../src/api/calls/me_call"
import { pendingCourierApplicationsCall } from "../../src/api/calls/pending_courier_applications_call"
import { pendingSellerApplicationsCall } from "../../src/api/calls/pending_seller_applications_call"
import { returnsNeedingAttentionCall } from "../../src/api/calls/returns_needing_attention_call"
import { sagasNeedingAttentionCall } from "../../src/api/calls/sagas_needing_attention_call"
import { sessionCall } from "../../src/api/calls/session_call"
import { setupTwoFactorCall } from "../../src/api/calls/setup_two_factor_call"
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
  sagasNeedingAttentionCall
]

const otherAppOnly: Readonly<Record<string, string>> = {
  "rest.edge.login.case.session": "a password alone starts a session on the seller web only",
  "rest.edge.verifyTwoFactor.case.sessionSellerWeb": "the seller web's session; the backoffice admits only admins"
}

const sellerExamples: Readonly<Record<string, string>> = {
  "rest.edge.session.case.signedIn": "the documented example is a seller's session; on the backoffice it is an admin's"
}

export { backofficeCalls, otherAppOnly, sellerExamples }
