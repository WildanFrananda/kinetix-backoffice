import type { KeyHint } from "../types/key_hint.type"
import { Keycap } from "./Keycap"
import styles from "./KeyHints.module.css"

function KeyHints({ label, hints }: { label: string; hints: readonly KeyHint[] }) {
  return (
    <ul className={styles.keys} aria-label={label}>
      {hints.map((hint) => (
        <li key={hint.keys.join("")}>
          {hint.keys.map((key) => (
            <Keycap key={key}>{key}</Keycap>
          ))}
          {hint.label}
        </li>
      ))}
    </ul>
  )
}

export { KeyHints }
