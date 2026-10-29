type QueueKeys = {
  enabled: boolean
  next: () => void
  previous: () => void
  approve: (() => void) | null
  reject: (() => void) | null
}

export type { QueueKeys }
