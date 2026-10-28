import { Button as AriaButton, type ButtonProps } from "react-aria-components"
import styles from "./Button.module.css"

function Button({ variant = "primary", ...props }: ButtonProps & { variant?: "primary" | "secondary" | "quiet" }) {
  return <AriaButton {...props} className={styles[variant]} />
}

export { Button }
