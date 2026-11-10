import { ListBox, ListBoxItem, Text } from "react-aria-components"
import type { AttentionReturn } from "../../types/attention_return.type"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Orders.module.css"
import { useOrdersText } from "./orders_text"

function ReturnList({
  returns,
  selected,
  onSelect
}: {
  returns: readonly AttentionReturn[]
  selected: string | null
  onSelect: (returnNumber: string) => void
}) {
  const text = useOrdersText()

  return (
    <ListBox
      aria-label={text["returns.list.title"]}
      className={styles.list}
      items={returns.map((item) => ({ id: item.returnNumber, item }))}
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
      {(entry) => (
        <ListBoxItem id={entry.id} textValue={entry.item.returnNumber} className={styles.item}>
          <Text slot="label" className={styles.itemName}>
            {entry.item.returnNumber}
          </Text>
          <StatusTag tone={entry.item.status === "OPEN" ? "neutral" : "attention"}>
            {text[`returns.status.${entry.item.status}`]}
          </StatusTag>
          <Text slot="description" className={styles.itemMeta}>
            <span className={styles.itemCode}>{entry.item.orderNumber}</span>
            <RelativeTime instant={entry.item.openedAt} />
          </Text>
        </ListBoxItem>
      )}
    </ListBox>
  )
}

export { ReturnList }
