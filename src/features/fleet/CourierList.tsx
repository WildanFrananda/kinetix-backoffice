import { ListBox, ListBoxItem, Text } from "react-aria-components"
import { formatText } from "../../i18n/format_text"
import type { FleetCourier } from "../../types/fleet_courier.type"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Fleet.module.css"
import { useFleetText } from "./fleet_text"
import { courierTone } from "./job_status"
import { PositionAge } from "./PositionAge"

function CourierList({
  couriers,
  selected,
  onSelect
}: {
  couriers: readonly FleetCourier[]
  selected: number | null
  onSelect: (id: number) => void
}) {
  const text = useFleetText()

  return (
    <ListBox
      aria-label={text["fleet.list.title"]}
      className={styles.list}
      items={couriers.map((courier) => ({ id: courier.id, courier }))}
      selectionMode="single"
      selectionBehavior="replace"
      selectedKeys={selected === null ? [] : [selected]}
      onSelectionChange={(keys) => {
        if (keys === "all") {
          return
        }

        const [picked] = [...keys]
        if (typeof picked === "number") {
          onSelect(picked)
        }
      }}
    >
      {(item) => (
        <ListBoxItem
          id={item.id}
          textValue={formatText(text["fleet.courier.name"], { id: String(item.courier.id) })}
          className={styles.item}
        >
          <Text slot="label" className={styles.itemName}>
            {formatText(text["fleet.courier.name"], { id: String(item.courier.id) })}
          </Text>
          <StatusTag tone={courierTone(item.courier.status)}>
            {text[`fleet.courierStatus.${item.courier.status}`]}
          </StatusTag>
          <Text slot="description" className={styles.itemMeta}>
            <PositionAge instant={item.courier.position === null ? null : item.courier.recordedAt} />
          </Text>
        </ListBoxItem>
      )}
    </ListBox>
  )
}

export { CourierList }
