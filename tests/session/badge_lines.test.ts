import { describe, expect, it } from "vitest"
import { guillochePaths, machineLines, monogram } from "../../src/features/session/badge_lines"

const account = {
  principalId: "3c9d2e7a-6b1f-4d8e-a5c4-7e2f1b0a9d8c",
  userId: 17,
  email: "siti.rahmawati@example.com",
  role: "admin",
  expiresAt: new Date("2026-10-29T10:00:00.000Z")
}

describe("the identity card's printing", () => {
  it("takes the monogram from the address, two letters at most", () => {
    expect(monogram("siti.rahmawati@example.com")).toBe("SR")
    expect(monogram("admin@example.com")).toBe("AD")
    expect(monogram("x@example.com")).toBe("X")
  })

  it("writes two machine lines of fixed width from the account itself", () => {
    const [first, second] = machineLines(account)

    expect(first).toBe("KX<BACKOFFICE<<ADMIN<<<<<<<<<<<<<<<<<<<<<<<<")
    expect(second).toBe("3C9D2E7A6B1F4D8EA5C47E2F1B0A9D8C<<00000017<<")
    expect([first.length, second.length]).toEqual([44, 44])
  })

  it("draws its pattern inside the card", () => {
    const paths = guillochePaths(400, 250, 12)
    const numbers = paths.flatMap((path) => path.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)

    expect(paths).toHaveLength(12)
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...numbers)).toBeLessThanOrEqual(400)
  })
})
