type SignedInSession = {
  authenticated: true
  role: "admin"
  principalId: string
  expiresAt: Date
}

export type { SignedInSession }
