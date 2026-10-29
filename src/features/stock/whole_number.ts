const largest = 2_147_483_647

function wholeNumber(text: string): number | null {
  const trimmed = text.trim()
  if (!/^\d{1,10}$/.test(trimmed)) {
    return null
  }

  const value = Number(trimmed)

  return value <= largest ? value : null
}

export { wholeNumber }
