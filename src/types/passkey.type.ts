type Passkey = {
  id: string
  name: string
  createdAt: Date
  lastUsedAt: Date | null
  deviceType: string
  backedUp: boolean
}

export type { Passkey }
