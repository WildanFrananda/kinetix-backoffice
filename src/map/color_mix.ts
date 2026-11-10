const hexColor = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

function channels(color: string): [number, number, number] {
  const value = color.trim()
  if (!hexColor.test(value)) {
    throw new Error(`not a hex colour: ${value}`)
  }

  const digits = value.length === 4 ? [...value.slice(1)].map((digit) => digit + digit).join("") : value.slice(1)

  return [0, 2, 4].map((at) => Number.parseInt(digits.slice(at, at + 2), 16)) as [number, number, number]
}

function hex(value: number): string {
  return Math.round(Math.min(255, Math.max(0, value)))
    .toString(16)
    .padStart(2, "0")
}

function mixColor(from: string, to: string, share: number): string {
  const a = channels(from)
  const b = channels(to)

  return `#${a.map((channel, index) => hex(channel + ((b[index] ?? channel) - channel) * share)).join("")}`
}

export { mixColor }
