import { createHash } from "node:crypto"

function inlineScriptHashes(html: string): string[] {
  const hashes: string[] = []

  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    const attributes = match[1] ?? ""
    const body = match[2] ?? ""

    if (/\bsrc\s*=/.test(attributes)) {
      continue
    }

    hashes.push(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`)
  }

  return [...new Set(hashes)]
}

export { inlineScriptHashes }
