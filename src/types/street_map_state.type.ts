import type { BasemapManifest } from "./basemap_manifest.type"

type StreetMapState =
  | { kind: "probing" }
  | { kind: "street"; manifest: BasemapManifest }
  | { kind: "plane"; reason: "no-webgl" | "no-basemap" | "failed" }
  | { kind: "plane"; reason: "unreadable"; status: number }

export type { StreetMapState }
