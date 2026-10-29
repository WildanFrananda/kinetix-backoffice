import * as v from "valibot"
import type { ApplicantProfile } from "../../types/applicant_profile.type"
import type { BffCall } from "../../types/bff_call.type"

const profileSchema = v.object({
  fullName: v.string(),
  phoneNumber: v.string()
})

function applicantProfileCall(userId: number): BffCall<ApplicantProfile> {
  return {
    endpoint: "identity.getProfile",
    method: "GET",
    path: `/bff/api/v1/users/${userId}/profile`,
    schema: profileSchema
  }
}

export { applicantProfileCall }
