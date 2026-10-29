import * as v from "valibot"
import { describe, expect, it } from "vitest"
import { nameSchema, slugSchema } from "../../src/features/categories/category_rules"
import { slugOf } from "../../src/features/categories/slug_of"

describe("a suggested slug", () => {
  it("is the name in lower case, words joined by hyphens", () => {
    expect(slugOf("Pakaian Pria")).toBe("pakaian-pria")
    expect(slugOf("  Kopi & Teh  ")).toBe("kopi-teh")
    expect(slugOf("Café Crème")).toBe("cafe-creme")
    expect(slugOf("HP / Tablet 2-in-1")).toBe("hp-tablet-2-in-1")
  })

  it("is empty when the name has no Latin letter or digit, and the admin writes one", () => {
    expect(slugOf("日本茶")).toBe("")
    expect(v.safeParse(slugSchema, slugOf("日本茶")).success).toBe(false)
  })

  it("never ends in a hyphen when it is cut to 128 characters", () => {
    const slug = slugOf(`${"a".repeat(127)} b`)

    expect(slug).toBe("a".repeat(127))
    expect(v.safeParse(slugSchema, slug).success).toBe(true)
  })
})

describe("the rules catalog documents", () => {
  it("take a slug of ASCII letters, digits, hyphens and underscores only", () => {
    expect(v.safeParse(slugSchema, "Pakaian_Pria-2").success).toBe(true)
    expect(v.safeParse(slugSchema, "pakaian pria").success).toBe(false)
    expect(v.safeParse(slugSchema, "kafé").success).toBe(false)
    expect(v.safeParse(slugSchema, "a".repeat(129)).success).toBe(false)
  })

  it("count a name's characters after trimming, as catalog does", () => {
    expect(v.safeParse(nameSchema, `  ${"é".repeat(128)}  `).success).toBe(true)
    expect(v.safeParse(nameSchema, "😀".repeat(128)).success).toBe(true)
    expect(v.safeParse(nameSchema, "x".repeat(129)).success).toBe(false)
    expect(v.safeParse(nameSchema, "   ").success).toBe(false)
    expect(v.safeParse(nameSchema, "a\u0000b").success).toBe(false)
  })
})
