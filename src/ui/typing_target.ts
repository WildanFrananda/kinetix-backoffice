const typingTargets = new Set(["INPUT", "TEXTAREA", "SELECT"])

function typingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    typingTargets.has(target.tagName) ||
    target.isContentEditable ||
    target.closest("[role='dialog'], [role='alertdialog']") !== null
  )
}

export { typingTarget }
