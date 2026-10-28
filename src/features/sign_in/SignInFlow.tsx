import { AnimatePresence, m } from "motion/react"
import { type ReactNode, useCallback, useReducer } from "react"
import { bffRequest } from "../../api/bff_request"
import { logoutCall } from "../../api/calls/logout_call"
import type { SignInNotice } from "../../types/sign_in_notice.type"
import type { SignedInSession } from "../../types/signed_in_session.type"
import { easeIn, enter } from "../../ui/motion/motion_presets"
import { ChallengeStep } from "./ChallengeStep"
import { CredentialsStep } from "./CredentialsStep"
import { EnrolmentStep } from "./EnrolmentStep"
import { initialStep, signInReducer } from "./sign_in_reducer"

function SignInFlow({
  notice,
  onSignedIn
}: {
  notice: SignInNotice | null
  onSignedIn: (session: SignedInSession) => void
}) {
  const [step, dispatch] = useReducer(signInReducer, notice, initialStep)
  const restart = useCallback(() => {
    dispatch({ type: "restart" })
    void bffRequest(logoutCall)
  }, [])

  function current(): ReactNode {
    switch (step.name) {
      case "credentials":
        return <CredentialsStep notice={step.notice} dispatch={dispatch} />
      case "challenge":
        return <ChallengeStep endsAt={step.endsAt} dispatch={dispatch} onSignedIn={onSignedIn} onRestart={restart} />
      case "enrolment":
        return <EnrolmentStep endsAt={step.endsAt} setup={step.setup} dispatch={dispatch} onRestart={restart} />
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={step.name}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0, transition: enter }}
        exit={{ opacity: 0, x: -12, transition: { duration: 0.12, ease: easeIn } }}
      >
        {current()}
      </m.div>
    </AnimatePresence>
  )
}

export { SignInFlow }
