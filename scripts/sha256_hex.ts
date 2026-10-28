import { createHash } from "node:crypto"

function sha256Hex(content: Buffer | string): string {
  return createHash("sha256").update(content).digest("hex")
}

export { sha256Hex }
