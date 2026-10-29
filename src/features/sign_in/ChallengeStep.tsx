import { useCallback, useState } from "react"
import { bffRequest } from "../../api/bff_request"
import { passkeyOptionsCall } from "../../api/calls/passkey_options_call"
import { verifyPasskeyCall } from "../../api/calls/verify_passkey_call"
import { verifyTwoFactorCall } from "../../api/calls/verify_two_factor_call"
import { formatDuration } from "../../i18n/format_duration"
import { formatText } from "../../i18n/format_text"
import { useText } from "../../i18n/use_text"
import type { BffFailure } from "../../types/bff_failure.type"
import type { SignInEvent } from "../../types/sign_in_event.type"
import type { SignedInSession } from "../../types/signed_in_session.type"
import { Button } from "../../ui/Button"
import { Fingerprint } from "../../ui/icons/Fingerprint"
import { Notice } from "../../ui/Notice"
import { askForPasskey, passkeyDeclined, supportsPasskeys } from "../passkeys/webauthn"
import { CodeForm } from "./CodeForm"
import { endsPending } from "./ends_pending"
import { refusalText } from "./refusal_text"
import styles from "./SignIn.module.css"
import { usePendingClock } from "./use_pending_clock"

function ChallengeStep({
  endsAt,
  passkeys,
  dispatch,
  onSignedIn,
  onRestart
}: {
  endsAt: number
  passkeys: boolean
  dispatch: (event: SignInEvent) => void
  onSignedIn: (session: SignedInSession) => void
  onRestart: () => void
}) {
  const text = useText()
  const end = useCallback(() => dispatch({ type: "pending-ended", notice: "pending-ended" }), [dispatch])
  const remaining = usePendingClock(endsAt, end)
  const [asking, setAsking] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const canUsePasskey = passkeys && supportsPasskeys()

  function settled(failure: BffFailure): void {
    const ended = endsPending(failure)
    if (ended !== null) {
      dispatch({ type: "pending-ended", notice: ended })
      return
    }

    setProblem(
      failure.kind === "refused" && failure.code === "PASSKEY_REFUSED"
        ? text["challenge.passkey.refused"]
        : refusalText(failure, text)
    )
  }

  async function signInWithPasskey(): Promise<void> {
    setAsking(true)
    setProblem(null)

    try {
      const options = await bffRequest(passkeyOptionsCall)
      if (!options.ok) {
        settled(options.failure)
        return
      }

      const credential = await askForPasskey(options.value)
      const result = await bffRequest(verifyPasskeyCall(credential))
      if (result.ok) {
        onSignedIn(result.value)
        return
      }

      settled(result.failure)
    } catch (error) {
      setProblem(text[passkeyDeclined(error) ? "challenge.passkey.declined" : "challenge.passkey.unusable"])
    } finally {
      setAsking(false)
    }
  }

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
      {canUsePasskey ? (
        <div className={styles.passkey}>
          <Button isDisabled={asking} onPress={() => void signInWithPasskey()}>
            <Fingerprint aria-hidden="true" />
            {asking ? text["challenge.passkey.waiting"] : text["challenge.passkey.use"]}
          </Button>
          <p className={styles.or}>{text["challenge.passkey.or"]}</p>
        </div>
      ) : null}
      {passkeys && !canUsePasskey ? <p className={styles.or}>{text["challenge.passkey.unsupported"]}</p> : null}
      {problem === null ? null : <Notice tone="problem">{problem}</Notice>}
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
