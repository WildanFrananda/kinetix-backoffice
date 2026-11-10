import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { relative } from "../../ui/RelativeTime"
import { useNow } from "../../ui/use_now"
import { useFleetText } from "./fleet_text"

function PositionAge({ instant }: { instant: Date | null }) {
  const text = useFleetText()
  const locale = useLocale()
  const now = useNow(instant !== null, 15_000)

  if (instant === null) {
    return <>{text["fleet.position.none"]}</>
  }

  const exact = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(instant)

  return (
    <time dateTime={instant.toISOString()} title={exact}>
      {formatText(text["fleet.position.age"], { age: relative(instant.getTime() - now, locale) })}
    </time>
  )
}

export { PositionAge }
