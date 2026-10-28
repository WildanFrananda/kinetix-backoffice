import { QRCodeSVG } from "qrcode.react"
import { useCallback, useEffect, useRef, useState } from "react"
import { bffRequest } from "../../api/bff_request"
import { enableTwoFactorCall } from "../../api/calls/enable_two_factor_call"
import { setupTwoFactorCall } from "../../api/calls/setup_two_factor_call"
import { failureText } from "../../i18n/failure_text"
import { formatDuration } from "../../i18n/format_duration"
import { formatText } from "../../i18n/format_text"
import { useText } from "../../i18n/use_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { SignInEvent } from "../../types/sign_in_event.type"
import type { TwoFactorSetup } from "../../types/two_factor_setup.type"
import { Button } from "../../ui/Button"
import { Notice } from "../../ui/Notice"
import { CodeForm } from "./CodeForm"
import { endsPending } from "./ends_pending"
import styles from "./SignIn.module.css"
import { usePendingClock } from "./use_pending_clock"

function groupedKey(secret: string): string {
  return (secret.match(/.{1,4}/g) ?? []).join(" ")
}

function EnrolmentStep({
  endsAt,
  setup,
  dispatch,
  onRestart
}: {
  endsAt: number
  setup: TwoFactorSetup | null
  dispatch: (event: SignInEvent) => void
  onRestart: () => void
}) {
  const text = useText()
  const [problem, setProblem] = useState<BffFailure | null>(null)
  const [copied, setCopied] = useState(false)
  const requested = useRef(false)
  const end = useCallback(() => dispatch({ type: "pending-ended", notice: "pending-ended" }), [dispatch])
  const remaining = usePendingClock(endsAt, end)

  const requestKey = useCallback(async () => {
    setProblem(null)
    setCopied(false)
    const result = await bffRequest(setupTwoFactorCall)
    if (result.ok) {
      dispatch({ type: "setup-received", setup: result.value })
      return
    }
    const ended = endsPending(result.failure)
    if (ended !== null) {
      dispatch({ type: "pending-ended", notice: ended })
      return
    }
    setProblem(result.failure)
  }, [dispatch])

  useEffect(() => {
    if (setup === null && !requested.current) {
      requested.current = true
      void requestKey()
    }
  }, [setup, requestKey])

  async function enable(code: string): Promise<BffFailure | null> {
    const result = await bffRequest(enableTwoFactorCall(code))
    if (result.ok) {
      dispatch({ type: "enrolment-confirmed" })
      return null
    }
    const ended = endsPending(result.failure)
    if (ended !== null) {
      dispatch({ type: "pending-ended", notice: ended })
      return null
    }
    return result.failure
  }

  async function copyKey(secret: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="enrolment-title">
      <h1 id="enrolment-title" className={styles.title}>
        {text["enrolment.title"]}
      </h1>
      <p className={styles.lead}>{text["enrolment.lead"]}</p>
      {problem === null ? null : <Notice tone="problem">{failureText(problem, text)}</Notice>}
      {setup === null ? (
        <p role="status">{text["enrolment.loading"]}</p>
      ) : (
        <>
          <div className={styles.qr}>
            <QRCodeSVG
              value={setup.qrCodeUrl}
              size={192}
              level="M"
              marginSize={2}
              fgColor="#000000"
              bgColor="#ffffff"
              title={text["enrolment.qrLabel"]}
              role="img"
              aria-label={text["enrolment.qrLabel"]}
            />
          </div>
          <p className={styles.manual}>{text["enrolment.manual"]}</p>
          <code className={styles.key}>{groupedKey(setup.twoFactorSecret)}</code>
          <div className={styles.actions}>
            <Button variant="secondary" onPress={() => void copyKey(setup.twoFactorSecret)}>
              {copied ? text["enrolment.copied"] : text["enrolment.copy"]}
            </Button>
            <Button variant="quiet" onPress={() => void requestKey()}>
              {text["enrolment.newKey"]}
            </Button>
          </div>
          <div className={styles.confirm}>
            <CodeForm submitLabel={text["enrolment.submit"]} onCode={enable} />
          </div>
        </>
      )}
      <p className={styles.timer}>{formatText(text["enrolment.ends"], { time: formatDuration(remaining) })}</p>
      <div className={styles.actions}>
        <Button variant="quiet" onPress={onRestart}>
          {text["challenge.restart"]}
        </Button>
      </div>
    </section>
  )
}

export { EnrolmentStep }
