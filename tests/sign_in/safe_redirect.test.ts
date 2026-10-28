import { describe, expect, it } from "vitest"
import { safeRedirect } from "../../src/features/sign_in/safe_redirect"

describe("safeRedirect", () => {
  it("keeps a path inside the backoffice, query and hash included", () => {
    expect(safeRedirect("/orders/ORD-1?tab=returns#top")).toBe("/orders/ORD-1?tab=returns#top")
  })

  it("refuses anything that could leave the origin or loop", () => {
    for (const candidate of [
      undefined,
      "https://evil.example/",
      "//evil.example/",
      "/\\evil.example",
      "javascript:alert(1)",
      "orders",
      "/sign-in",
      "/sign-in?redirect=/x",
      "/bff/logout",
      "/a\u0000b",
      `/${"a".repeat(2048)}`
    ]) {
      expect(safeRedirect(candidate), String(candidate)).toBe("/")
    }
  })
})
