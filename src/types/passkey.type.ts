type Passkey = {
  id: string
  credentialId: string
  name: string
  createdAt: Date
  lastUsedAt: Date | null
  deviceType: string
  backedUp: boolean
}

export type { Passkey }
