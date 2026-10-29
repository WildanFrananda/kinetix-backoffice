import { describe, expect, it } from "vitest"
import accountEn from "../../src/catalogue/account/en.json"
import accountId from "../../src/catalogue/account/id.json"
import approvalsEn from "../../src/catalogue/approvals/en.json"
import approvalsId from "../../src/catalogue/approvals/id.json"
import en from "../../src/catalogue/en.json"
import id from "../../src/catalogue/id.json"
import { formatText } from "../../src/i18n/format_text"
import { preferredLocale } from "../../src/i18n/preferred_locale"

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? "").sort()
}

const pairs: ReadonlyArray<[string, Record<string, string>, Record<string, string>]> = [
  ["the shell", en, id],
  ["approvals", approvalsEn, approvalsId],
  ["the account page", accountEn, accountId]
]

describe.each(pairs)("the catalogues of %s", (_, english, indonesian) => {
  it("hold the same keys, none blank, with the same placeholders", () => {
    expect(Object.keys(indonesian).sort()).toEqual(Object.keys(english).sort())

    for (const [key, text] of Object.entries(english)) {
      const translated = indonesian[key] ?? ""
      expect(text.trim(), key).not.toBe("")
      expect(translated.trim(), key).not.toBe("")
      expect(placeholders(translated), key).toEqual(placeholders(text))
    }
  })
})

describe("feature catalogues", () => {
  it("never redefine a key of the shell's", () => {
    for (const feature of [approvalsEn, accountEn]) {
      expect(Object.keys(feature).filter((key) => Object.hasOwn(en, key))).toEqual([])
    }
  })
})

describe("preferredLocale", () => {
  it("takes the first language it knows", () => {
    expect(preferredLocale(["id-ID", "en-US"])).toBe("id")
    expect(preferredLocale(["fr-FR", "en-GB", "id"])).toBe("en")
    expect(preferredLocale(["in"])).toBe("id")
    expect(preferredLocale(["ja"])).toBe("en")
    expect(preferredLocale([])).toBe("en")
  })
})

describe("formatText", () => {
  it("fills named placeholders and leaves unknown ones visible", () => {
    expect(formatText("Signed in as {role} until {time}.", { role: "admin", time: "17:00" })).toBe(
      "Signed in as admin until 17:00."
    )

    expect(formatText("Reference: {reference}", {})).toBe("Reference: {reference}")
  })
})
