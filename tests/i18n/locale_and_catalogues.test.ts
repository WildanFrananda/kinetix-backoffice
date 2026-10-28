import { describe, expect, it } from "vitest"
import en from "../../src/catalogue/en.json"
import id from "../../src/catalogue/id.json"
import { formatText } from "../../src/i18n/format_text"
import { preferredLocale } from "../../src/i18n/preferred_locale"

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? "").sort()
}

describe("catalogues", () => {
  it("hold the same keys, none blank, with the same placeholders", () => {
    expect(Object.keys(id).sort()).toEqual(Object.keys(en).sort())

    for (const [key, text] of Object.entries(en)) {
      const translated = (id as Record<string, string>)[key] ?? ""
      expect(text.trim(), key).not.toBe("")
      expect(translated.trim(), key).not.toBe("")
      expect(placeholders(translated), key).toEqual(placeholders(text))
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
