import { bffFetch } from "../../api/bff_fetch"
import { approveCourierCall } from "../../api/calls/approve_courier_call"
import { rejectCourierCall } from "../../api/calls/reject_courier_call"
import { rejectSellerCall } from "../../api/calls/reject_seller_call"
import { verifySellerCall } from "../../api/calls/verify_seller_call"
import type { CourierApplication } from "../../types/courier_application.type"
import type { DecisionKind } from "../../types/decision_kind.type"
import type { DecisionReport } from "../../types/decision_report.type"
import type { SellerApplication } from "../../types/seller_application.type"

async function decideSeller(kind: DecisionKind, application: SellerApplication): Promise<DecisionReport> {
  if (kind === "reject") {
    await bffFetch(rejectSellerCall(application.userId))

    return { id: application.applicationId, outcome: "rejected", name: application.storeName, unplaced: false }
  }

  const merchant = await bffFetch(verifySellerCall(application.userId))

  return { id: application.applicationId, outcome: "approved", name: merchant.storeName, unplaced: !merchant.placed }
}

async function decideCourier(kind: DecisionKind, application: CourierApplication): Promise<DecisionReport> {
  if (kind === "reject") {
    const rejected = await bffFetch(rejectCourierCall(application.principalId))

    return { id: application.applicationId, outcome: "rejected", name: rejected.email, unplaced: false }
  }

  const approval = await bffFetch(approveCourierCall(application.principalId))

  return { id: application.applicationId, outcome: "approved", name: approval.email, unplaced: false }
}

export { decideCourier, decideSeller }
