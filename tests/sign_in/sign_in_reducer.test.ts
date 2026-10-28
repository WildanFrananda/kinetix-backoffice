import { describe, expect, it } from "vitest"
import { initialStep, signInReducer } from "../../src/features/sign_in/sign_in_reducer"

const setup = { twoFactorSecret: "AAAA", qrCodeUrl: "otpauth://totp/x", enabled: false as const }

describe("signInReducer", () => {
  it("asks for a code for five minutes after mfaRequired", () => {
    const step = signInReducer(initialStep(null), {
      type: "password-accepted",
      outcome: { mfaRequired: true },
      now: 1_000
    })

    expect(step).toEqual({ name: "challenge", endsAt: 301_000 })
  })

  it("enrols for ten minutes after mfaEnrolmentRequired, the key still to come", () => {
    const step = signInReducer(initialStep(null), {
      type: "password-accepted",
      outcome: { mfaEnrolmentRequired: true },
      now: 0
    })

    expect(step).toEqual({ name: "enrolment", endsAt: 600_000, setup: null })
  })

  it("takes a key only while enrolling", () => {
    const enrolling = { name: "enrolment" as const, endsAt: 1, setup: null }
    expect(signInReducer(enrolling, { type: "setup-received", setup })).toEqual({ ...enrolling, setup })
    const challenge = { name: "challenge" as const, endsAt: 1 }
    expect(signInReducer(challenge, { type: "setup-received", setup })).toBe(challenge)
  })

  it("returns to the password with the reason after an enrolment or an ended sign-in", () => {
    const enrolling = { name: "enrolment" as const, endsAt: 1, setup }
    expect(signInReducer(enrolling, { type: "enrolment-confirmed" })).toEqual({
      name: "credentials",
      notice: "enrolled"
    })

    expect(signInReducer(enrolling, { type: "pending-ended", notice: "pending-ended" })).toEqual({
      name: "credentials",
      notice: "pending-ended"
    })

    expect(signInReducer(enrolling, { type: "restart" })).toEqual({ name: "credentials", notice: null })
  })
})
