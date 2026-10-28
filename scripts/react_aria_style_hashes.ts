import { createHash } from "node:crypto"

function reactAriaStyleHashes(preventScrollSource: string): string[] {
  const literals = [...preventScrollSource.matchAll(/style\.textContent = `([^`$]*)`\.trim\(\);/g)]
  if (literals.length !== 1) {
    throw new Error(
      `expected one injected style in React Aria's usePreventScroll, found ${literals.length}; read the new source and update scripts/react_aria_style_hashes.ts`
    )
  }

  const text = (literals[0]?.[1] ?? "").trim()

  return [`'sha256-${createHash("sha256").update(text, "utf8").digest("base64")}'`]
}

export { reactAriaStyleHashes }
