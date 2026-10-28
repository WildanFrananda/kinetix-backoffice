type Session =
  | {
      authenticated: true
      role: "admin"
      principalId: string
      expiresAt: Date
    }
  | {
      authenticated: false
    }

export type { Session }
