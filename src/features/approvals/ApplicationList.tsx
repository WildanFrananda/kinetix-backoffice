import type { ReactNode } from "react"
import { ListBox, ListBoxItem } from "react-aria-components"
import styles from "./Approvals.module.css"

function ApplicationList<Application>({
  label,
  applications,
  idOf,
  nameOf,
  selected,
  onSelect,
  children
}: {
  label: string
  applications: readonly Application[]
  idOf: (application: Application) => number
  nameOf: (application: Application) => string
  selected: number | null
  onSelect: (id: number) => void
  children: (application: Application) => ReactNode
}) {
  return (
    <ListBox
      aria-label={label}
      className={styles.list}
      items={applications.map((application) => ({ id: idOf(application), application }))}
      selectionMode="single"
      selectionBehavior="replace"
      disallowEmptySelection
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
        <ListBoxItem id={item.id} textValue={nameOf(item.application)} className={styles.item}>
          {children(item.application)}
        </ListBoxItem>
      )}
    </ListBox>
  )
}

export { ApplicationList }
