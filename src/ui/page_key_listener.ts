import { typingTarget } from "./typing_target"

type PageKeyActions = Readonly<Record<string, (() => void) | null>>

type PageKeyState = {
  keys: PageKeyActions
  enabled: boolean
}

function listenForPageKeys(read: () => PageKeyState): () => void {
  function press(event: KeyboardEvent): void {
    const current = read()
    if (!current.enabled || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return
    }

    const key = event.key.toLowerCase()
    if (!Object.hasOwn(current.keys, key) || typingTarget(event.target)) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const action = current.keys[key]
    if (action !== undefined && action !== null && !event.repeat) {
      action()
    }
  }

  window.addEventListener("keydown", press, { capture: true })

  return () => window.removeEventListener("keydown", press, { capture: true })
}

export type { PageKeyActions }
export { listenForPageKeys }
