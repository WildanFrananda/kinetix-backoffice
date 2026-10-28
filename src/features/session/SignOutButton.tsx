import { useText } from "../../i18n/use_text"
import { Button } from "../../ui/Button"
import { useSignOut } from "./use_sign_out"

function SignOutButton() {
  const text = useText()
  const { signOut, pending, failure } = useSignOut()
  return (
    <>
      {failure === null ? null : (
        <span role="alert" data-tone="problem">
          {text["signOut.failed"]}
        </span>
      )}
      <Button variant="secondary" isDisabled={pending} onPress={() => void signOut()}>
        {pending ? text["nav.signingOut"] : text["nav.signOut"]}
      </Button>
    </>
  )
}

export { SignOutButton }
