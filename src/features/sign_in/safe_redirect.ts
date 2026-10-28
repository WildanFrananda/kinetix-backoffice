const maximumLength = 2048

function safeRedirect(candidate: string | undefined): string {
  if (candidate === undefined || candidate.length > maximumLength) {
    return "/"
  }
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return "/"
  }
  if ([...candidate].some((character) => (character.codePointAt(0) ?? 0) < 0x20 || character === "\u007f")) {
    return "/"
  }
  const path = candidate.split(/[?#]/)[0] ?? "/"
  if (path === "/sign-in" || path.startsWith("/sign-in/") || path.startsWith("/bff/")) {
    return "/"
  }
  return candidate
}

export { safeRedirect }
