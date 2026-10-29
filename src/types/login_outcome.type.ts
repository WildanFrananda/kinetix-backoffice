type LoginOutcome = { mfaRequired: true; passkeys?: boolean | undefined } | { mfaEnrolmentRequired: true }

export type { LoginOutcome }
