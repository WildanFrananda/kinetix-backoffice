import { Check, Copy } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { Button } from "react-aria-components"
import { formatText } from "../i18n/format_text"
import { useText } from "../i18n/use_text"
import styles from "./CopyValue.module.css"

function CopyValue({ value, label }: { value: string; label: string }) {
  const text = useText()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }

    const timer = window.setTimeout(() => setCopied(false), 1600)

    return () => window.clearTimeout(timer)
  }, [copied])

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <span className={styles.value}>
      <span className={styles.text}>{value}</span>
      <Button
        className={styles.copy}
        aria-label={copied ? text["copy.done"] : formatText(text["copy.label"], { label })}
        onPress={() => void copy()}
      >
        {copied ? <Check aria-hidden="true" size={14} /> : <Copy aria-hidden="true" size={14} />}
      </Button>
    </span>
  )
}

export { CopyValue }
