type GovernorOptions = {
  limit: number
  windowMs: number
  now: () => number
  channelName: string | null
}

export type { GovernorOptions }
