import type { SharedFile } from "./types/shared_file.type.ts"

const sharedSource = "WildanFrananda/kinetix-docs"

const sharedFiles: readonly SharedFile[] = [
  { path: "src/styles/kx-tokens.css", from: "src/styles/kx-tokens.css" },
  { path: "src/assets/kinetix-mark-dark.svg", from: "src/assets/kinetix-mark-dark.svg" },
  { path: "src/assets/kinetix-mark-light.svg", from: "src/assets/kinetix-mark-light.svg" },
  { path: "public/favicon.svg", from: "public/favicon.svg" }
]

export { sharedFiles, sharedSource }
