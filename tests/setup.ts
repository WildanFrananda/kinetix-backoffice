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

function scrollNowhere(): void {
  return
}

if (typeof window.matchMedia !== "function") {
  window.matchMedia = quietMediaQuery
}

if (typeof Element.prototype.scrollIntoView !== "function") {
  Element.prototype.scrollIntoView = scrollNowhere
}

afterEach(() => {
  cleanup()
})
