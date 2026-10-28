import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { reactAriaStyleHashes } from "../../scripts/react_aria_style_hashes.ts"

const overscroll = "@layer {\n  * {\n    overscroll-behavior: contain;\n  }\n}"

describe("reactAriaStyleHashes", () => {
  it("hashes the style React Aria injects for modals on mobile WebKit, as the browser hashes it", () => {
    const source = readFileSync("node_modules/react-aria/dist/private/overlays/usePreventScroll.mjs", "utf8")
    const expected = `'sha256-${createHash("sha256").update(overscroll).digest("base64")}'`
    expect(reactAriaStyleHashes(source)).toEqual([expected])
  })

  it("refuses a source it cannot read rather than allowing nothing or everything", () => {
    expect(() => reactAriaStyleHashes("style.textContent = someVariable;")).toThrow(/found 0/)
  })
})
