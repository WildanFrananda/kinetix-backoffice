type LeakRule = {
  name: string
  pattern: RegExp
  permits: (match: string) => boolean
}

export type { LeakRule }
