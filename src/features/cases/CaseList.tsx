import { ListBox, ListBoxItem, Text } from "react-aria-components"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { CaseSummary } from "../../types/case_summary.type"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Cases.module.css"
import { merchantHeading, standingLabel, standingTone } from "./case_format"
import { useCasesText } from "./cases_text"

function CaseList({
  cases,
  selected,
  onSelect
}: {
  cases: readonly CaseSummary[]
  selected: string | null
  onSelect: (merchantId: string) => void
}) {
  const text = useCasesText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)

  return (
    <ListBox
      aria-label={text["cases.list.title"]}
      className={styles.list}
      items={cases}
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
      {(item) => {
        const heading = merchantHeading(item, text, "item")

        return (
          <ListBoxItem id={item.merchantPrincipalId} textValue={heading} className={styles.item}>
            <Text slot="label" className={styles.itemName}>
              {heading}
            </Text>
            <StatusTag tone={standingTone(item.merchant.status)}>{standingLabel(item.merchant.status, text)}</StatusTag>
            <Text slot="description" className={styles.itemMeta}>
              {formatText(text["cases.item.counts"], {
                confirmed: numbers.format(item.confirmedCount),
                pending: numbers.format(item.pendingCount),
                windows: numbers.format(item.windowCount)
              })}
            </Text>
          </ListBoxItem>
        )
      }}
    </ListBox>
  )
}

export { CaseList }
