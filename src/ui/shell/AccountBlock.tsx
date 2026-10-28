import { SignOut } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "react-aria-components"
import { accountQuery, sessionQuery } from "../../api/session_query"
import { useSignOut } from "../../features/session/use_sign_out"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { useText } from "../../i18n/use_text"
import styles from "./AccountBlock.module.css"

function AccountBlock() {
  const text = useText()
  const locale = useLocale()
  const account = useQuery(accountQuery())
  const session = useQuery(sessionQuery())
  const { signOut, pending, failure } = useSignOut()
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" })
  const endsAt = session.data?.authenticated === true ? session.data.expiresAt : null

  return (
    <div className={styles.block}>
      <div className={styles.who}>
        <span className={styles.email} title={account.data?.email}>
          {account.data?.email ?? "…"}
        </span>
        <span className={styles.role}>{text["account.roleAdmin"]}</span>
      </div>
      {endsAt === null ? null : (
        <p className={styles.ends}>{formatText(text["shell.sessionUntil"], { time: time.format(endsAt) })}</p>
      )}
      {failure === null ? null : (
        <p className={styles.failed} role="alert">
          {text["signOut.failed"]}
        </p>
      )}
      <Button className={styles.signOut} isDisabled={pending} onPress={() => void signOut()}>
        <SignOut aria-hidden="true" />
        <span>{pending ? text["nav.signingOut"] : text["nav.signOut"]}</span>
      </Button>
    </div>
  )
}

export { AccountBlock }
