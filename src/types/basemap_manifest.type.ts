type BasemapManifest = {
  build: string
  source: string
  bounds: [number, number, number, number]
  maxZoom: number
  bytes: number
  sha256: string
  writtenAt: Date
}

export type { BasemapManifest }
