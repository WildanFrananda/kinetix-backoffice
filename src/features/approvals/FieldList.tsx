import type { ReactNode } from "react"
import styles from "./Approvals.module.css"

function FieldList({ fields }: { fields: ReadonlyArray<{ label: string; value: ReactNode; mono?: boolean }> }) {
  return (
    <dl className={styles.fields}>
      {fields.map((field) => (
        <div key={field.label} className={styles.field}>
          <dt>{field.label}</dt>
          <dd className={field.mono === true ? styles.mono : undefined}>{field.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export { FieldList }
