type SharedLock = {
  source: string
  files: Array<{
    path: string
    from: string
    sha256: string
  }>
}

export type { SharedLock }
