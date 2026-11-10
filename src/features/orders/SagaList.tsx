import { ListBox, ListBoxItem, Text } from "react-aria-components"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { AttentionSaga } from "../../types/attention_saga.type"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Orders.module.css"
import { useOrdersText } from "./orders_text"

function SagaList({
  sagas,
  selected,
  onSelect
}: {
  sagas: readonly AttentionSaga[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const text = useOrdersText()
  const numbers = new Intl.NumberFormat(useLocale())

  return (
    <ListBox
      aria-label={text["sagas.list.title"]}
      className={styles.list}
      items={sagas.map((saga) => ({ id: saga.sagaId, saga }))}
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
      {(item) => (
        <ListBoxItem id={item.id} textValue={item.saga.orderNumber} className={styles.item}>
          <Text slot="label" className={styles.itemName}>
            {item.saga.orderNumber}
          </Text>
          <StatusTag tone={item.saga.state === "Abandoned" ? "attention" : "neutral"}>
            {text[`sagas.state.${item.saga.state}`]}
          </StatusTag>
          <Text slot="description" className={styles.itemMeta}>
            <span className={styles.itemCode}>
              {item.saga.lastFailureCode ?? text["sagas.item.noFailure"]}
              {" · "}
              {formatText(text["sagas.item.steps"], { count: numbers.format(item.saga.unreleasedSteps.length) })}
            </span>
            {item.saga.needsAttentionAt === null ? null : <RelativeTime instant={item.saga.needsAttentionAt} />}
          </Text>
        </ListBoxItem>
      )}
    </ListBox>
  )
}

export { SagaList }
