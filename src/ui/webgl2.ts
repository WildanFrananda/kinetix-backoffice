function supportsWebgl2(): boolean {
  try {
    const probe = document.createElement("canvas").getContext("webgl2")
    probe?.getExtension("WEBGL_lose_context")?.loseContext()

    return probe !== null
  } catch {
    return false
  }
}

export { supportsWebgl2 }
