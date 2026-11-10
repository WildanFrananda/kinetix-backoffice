const pngDataUri = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/

const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function pngBytes(dataUri: string): Uint8Array<ArrayBuffer> | null {
  const match = pngDataUri.exec(dataUri)
  if (match === null || match[1] === undefined) {
    return null
  }

  let binary: string
  try {
    binary = atob(match[1])
  } catch {
    return null
  }

  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
  if (!pngSignature.every((byte, index) => bytes[index] === byte)) {
    return null
  }

  return bytes
}

export { pngBytes }
