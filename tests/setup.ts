import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

function quietMediaQuery(query: string): MediaQueryList {
  return Object.assign(new EventTarget(), {
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined
  })
}

if (typeof window.matchMedia !== "function") {
  window.matchMedia = quietMediaQuery
}

afterEach(() => {
  cleanup()
})
