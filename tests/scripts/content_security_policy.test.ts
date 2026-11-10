import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { contentSecurityPolicy } from "../../scripts/content_security_policy.ts"
import { inlineScriptHashes } from "../../scripts/inline_script_hashes.ts"

describe("inlineScriptHashes", () => {
  it("hashes each inline script once and skips scripts loaded by src", () => {
    const body = "self.x=1"
    const html = `<script src="/theme.js"></script><script>${body}</script><script data-a="">${body}</script>`
    const expected = `'sha256-${createHash("sha256").update(body).digest("base64")}'`
    expect(inlineScriptHashes(html)).toEqual([expected])
  })
})

describe("contentSecurityPolicy", () => {
  it("allows only this origin and the hashed inline scripts", () => {
    const policy = contentSecurityPolicy(["'sha256-abc'"], ["'sha256-def'"])
    expect(policy).toContain("default-src 'none'")
    expect(policy).toContain("script-src 'self' 'sha256-abc'")
    expect(policy).toContain("style-src 'self' 'sha256-def'")
    expect(policy).toContain("connect-src 'self'")
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).toContain("require-trusted-types-for 'script'")
    expect(policy).not.toMatch(/unsafe-(inline|eval)/)
  })

  it("admits the map's worker from this origin and only the Trusted Types policy named default", () => {
    const policy = contentSecurityPolicy([], [])
    expect(policy).toContain("worker-src 'self'")
    expect(policy).toContain("trusted-types default")
    expect(policy).not.toContain("allow-duplicates")
    expect(policy).not.toMatch(/blob:|data:/)
  })

  it("leaves the storage origin to the container's start, as the only variable in the policy", () => {
    const policy = contentSecurityPolicy([], [])
    expect(policy).toContain(`img-src 'self' \${KINETIX_STORAGE_ORIGIN};`)
    expect(policy.match(/\$/g)).toHaveLength(1)
    expect(contentSecurityPolicy([], [], "https://storage.example.com")).toContain(
      "img-src 'self' https://storage.example.com;"
    )
  })
})
