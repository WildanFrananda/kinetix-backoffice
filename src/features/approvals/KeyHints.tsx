import { Keycap } from "../../ui/Keycap"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"

function KeyHints({ canReject }: { canReject: boolean }) {
  const text = useApprovalsText()

  return (
    <ul className={styles.keys} aria-label={text["approvals.keys.label"]}>
      <li>
        <Keycap>J</Keycap>
        <Keycap>K</Keycap>
        {text["approvals.keys.move"]}
      </li>
      <li>
        <Keycap>A</Keycap>
        {text["approvals.keys.approve"]}
      </li>
      {canReject ? (
        <li>
          <Keycap>R</Keycap>
          {text["approvals.keys.reject"]}
        </li>
      ) : null}
    </ul>
  )
}

export { KeyHints }
