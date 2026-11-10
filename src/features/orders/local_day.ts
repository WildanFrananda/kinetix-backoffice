const dayPattern = /^(\d{4})-(\d{2})-(\d{2})$/

function dayParts(day: string): readonly [number, number, number] | null {
  const match = dayPattern.exec(day)
  if (match === null) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const date = Number(match[3])
  const probe = new Date(Date.UTC(year, month - 1, date))
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== date) {
    return null
  }

  return [year, month, date]
}

function isDay(value: string): boolean {
  return dayParts(value) !== null
}

function two(value: number): string {
  return String(value).padStart(2, "0")
}

function offsetText(minutesEast: number): string {
  const size = Math.abs(minutesEast)

  return `${minutesEast < 0 ? "-" : "+"}${two(Math.floor(size / 60))}:${two(size % 60)}`
}

function localInstant(moment: Date): string {
  const day = `${String(moment.getFullYear()).padStart(4, "0")}-${two(moment.getMonth() + 1)}-${two(moment.getDate())}`
  const time = `${two(moment.getHours())}:${two(moment.getMinutes())}:${two(moment.getSeconds())}`

  return `${day}T${time}${offsetText(-moment.getTimezoneOffset())}`
}

function startOfDay(day: string, after: number): string | undefined {
  const parts = dayParts(day)
  if (parts === null) {
    return undefined
  }

  return localInstant(new Date(parts[0], parts[1] - 1, parts[2] + after))
}

function dayOf(moment: Date): string {
  return `${String(moment.getFullYear()).padStart(4, "0")}-${two(moment.getMonth() + 1)}-${two(moment.getDate())}`
}

export { dayOf, isDay, localInstant, offsetText, startOfDay }
