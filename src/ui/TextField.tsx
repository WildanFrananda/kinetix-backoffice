import { TextField as AriaTextField, FieldError, Input, Label, Text, type TextFieldProps } from "react-aria-components"
import styles from "./TextField.module.css"

function TextField({
  label,
  description,
  error,
  code = false,
  mono = false,
  ...props
}: Omit<TextFieldProps, "children" | "isInvalid"> & {
  label: string
  description?: string
  error?: string | null
  code?: boolean
  mono?: boolean
}) {
  const invalid = error !== undefined && error !== null
  return (
    <AriaTextField {...props} isInvalid={invalid} className={styles.field}>
      <Label className={styles.label}>{label}</Label>
      <Input className={code ? styles.code : mono ? styles.mono : styles.input} />
      {description === undefined ? null : (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <FieldError className={styles.error}>{error}</FieldError>
    </AriaTextField>
  )
}

export { TextField }
