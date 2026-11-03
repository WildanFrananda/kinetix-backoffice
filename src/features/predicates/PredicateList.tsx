import { ListBox, ListBoxItem, Text } from "react-aria-components"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { Predicate } from "../../types/predicate.type"
import styles from "./Predicates.module.css"
import { ratingOf } from "./predicate_format"
import { usePredicatesText } from "./predicates_text"

function PredicateList({
  predicates,
  selected,
  onSelect
}: {
  predicates: readonly Predicate[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const text = usePredicatesText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)

  return (
    <ListBox
      aria-label={text["predicates.list.title"]}
      className={styles.list}
      items={predicates}
      selectionMode="single"
      selectionBehavior="replace"
      selectedKeys={selected === null ? [] : [selected]}
      onSelectionChange={(keys) => {
        if (keys === "all") {
          return
        }

        const [picked] = [...keys]
        if (typeof picked === "string") {
          onSelect(picked)
        }
      }}
    >
      {(predicate) => (
        <ListBoxItem id={predicate.id} textValue={predicate.label} className={styles.item}>
          <Text slot="label" className={styles.itemName}>
            {predicate.label}
          </Text>
          <span className={predicate.rows.every((row) => row.placed) ? styles.placed : styles.placing}>
            {predicate.rows.every((row) => row.placed)
              ? text["predicates.state.placed"]
              : text["predicates.state.placing"]}
          </span>
          <Text slot="description" className={styles.itemSlug}>
            {formatText(text["predicates.item.minimums"], {
              deliveries: numbers.format(predicate.minimums.deliveries),
              rating: ratingOf(predicate.minimums.ratingHundredths, locale),
              days: numbers.format(predicate.minimums.daysActive),
              freshness: numbers.format(predicate.freshnessDays)
            })}
          </Text>
        </ListBoxItem>
      )}
    </ListBox>
  )
}

export { PredicateList }
