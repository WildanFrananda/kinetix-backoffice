const awayAfterMs = 5 * 60_000

const inputs = ["pointerdown", "keydown", "wheel", "touchstart"] as const

const listeners = new Set<() => void>()

let lastInput = Date.now()

let present = true

let timer: ReturnType<typeof setTimeout> | null = null

function setPresent(next: boolean): void {
  if (next === present) {
    return
  }

  present = next

  for (const listener of listeners) {
    listener()
  }
}

function scheduleAway(): void {
  if (timer !== null) {
    clearTimeout(timer)
  }

  timer = setTimeout(() => setPresent(false), Math.max(0, lastInput + awayAfterMs - Date.now()))
}

function noteInput(): void {
  lastInput = Date.now()
  setPresent(document.visibilityState === "visible")
  scheduleAway()
}

function noteVisibility(): void {
  if (document.visibilityState === "visible") {
    noteInput()

    return
  }

  setPresent(false)
}

function followPresence(): () => void {
  for (const input of inputs) {
    window.addEventListener(input, noteInput, { passive: true, capture: true })
  }

  document.addEventListener("visibilitychange", noteVisibility)
  noteInput()

  return () => {
    for (const input of inputs) {
      window.removeEventListener(input, noteInput, { capture: true })
    }

    document.removeEventListener("visibilitychange", noteVisibility)

    if (timer !== null) {
      clearTimeout(timer)
    }
  }
}

function isPresent(): boolean {
  return present
}

function subscribePresence(listener: () => void): () => void {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

export { awayAfterMs, followPresence, isPresent, subscribePresence }
