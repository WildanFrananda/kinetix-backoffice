import { ListBox, ListBoxItem, Text } from "react-aria-components"
import type { DispatchJob } from "../../types/dispatch_job.type"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import styles from "./Fleet.module.css"
import { useFleetText } from "./fleet_text"
import { jobTone } from "./job_status"

function JobList({
  jobs,
  selected,
  onSelect
}: {
  jobs: readonly DispatchJob[]
  selected: number | null
  onSelect: (id: number) => void
}) {
  const text = useFleetText()

  return (
    <ListBox
      aria-label={text["dispatch.list.title"]}
      className={styles.list}
      items={jobs.map((job) => ({ id: job.id, job }))}
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
        <ListBoxItem id={item.id} textValue={`${item.job.id} ${item.job.orderNumber ?? ""}`} className={styles.item}>
          <Text slot="label" className={styles.itemName}>
            {item.job.id}
          </Text>
          <StatusTag tone={jobTone(item.job.status)}>{text[`fleet.jobStatus.${item.job.status}`]}</StatusTag>
          <Text slot="description" className={styles.itemMeta}>
            <span className={styles.itemOrder}>{item.job.orderNumber ?? text["dispatch.item.noOrder"]}</span>
            <RelativeTime instant={item.job.insertedAt} />
          </Text>
        </ListBoxItem>
      )}
    </ListBox>
  )
}

export { JobList }
