import { useLocale } from "../i18n/use_locale"
import { useNow } from "./use_now"

const steps: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 30],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY]
]

function relative(milliseconds: number, locale: string): string {
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" })
  let amount = Math.round(milliseconds / 1000)

  for (const [unit, size] of steps) {
    if (Math.abs(amount) < size) {
      return format.format(amount, unit)
    }

    amount = Math.round(amount / size)
  }

  return format.format(amount, "year")
}

function RelativeTime({ instant }: { instant: Date }) {
  const locale = useLocale()
  const now = useNow(true, 15_000)
  const exact = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(instant)

  return (
    <time dateTime={instant.toISOString()} title={exact}>
      {relative(instant.getTime() - now, locale)}
    </time>
  )
}

export { RelativeTime, relative }
