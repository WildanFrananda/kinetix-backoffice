import { useCallback } from "react"
import { bffRequest } from "../../api/bff_request"
import { verifyTwoFactorCall } from "../../api/calls/verify_two_factor_call"
import { formatDuration } from "../../i18n/format_duration"
import { formatText } from "../../i18n/format_text"
import { useText } from "../../i18n/use_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { SignInEvent } from "../../types/sign_in_event.type"
import type { SignedInSession } from "../../types/signed_in_session.type"
import { Button } from "../../ui/Button"
import { CodeForm } from "./CodeForm"
import { endsPending } from "./ends_pending"
import styles from "./SignIn.module.css"
import { usePendingClock } from "./use_pending_clock"

function ChallengeStep({
  endsAt,
  dispatch,
  onSignedIn,
  onRestart
}: {
  endsAt: number
  dispatch: (event: SignInEvent) => void
  onSignedIn: (session: SignedInSession) => void
  onRestart: () => void
}) {
  const text = useText()
  const end = useCallback(() => dispatch({ type: "pending-ended", notice: "pending-ended" }), [dispatch])
  const remaining = usePendingClock(endsAt, end)

  async function verify(code: string): Promise<BffFailure | null> {
    const result = await bffRequest(verifyTwoFactorCall(code))
    if (result.ok) {
      onSignedIn(result.value)
      return null
    }

    const ended = endsPending(result.failure)
    if (ended !== null) {
      dispatch({ type: "pending-ended", notice: ended })
      return null
    }

    return result.failure
  }

  return (
    <section className={styles.panel} aria-labelledby="challenge-title">
      <h1 id="challenge-title" className={styles.title}>
        {text["challenge.title"]}
      </h1>
      <p className={styles.lead}>{text["challenge.lead"]}</p>
      <CodeForm submitLabel={text["challenge.submit"]} onCode={verify} />
      <p className={styles.timer}>{formatText(text["challenge.ends"], { time: formatDuration(remaining) })}</p>
      <div className={styles.actions}>
        <Button variant="quiet" onPress={onRestart}>
          {text["challenge.restart"]}
        </Button>
      </div>
    </section>
  )
}

export { ChallengeStep }
