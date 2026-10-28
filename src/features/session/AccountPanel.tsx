import { useQuery } from "@tanstack/react-query"
import { accountQuery, sessionQuery } from "../../api/session_query"
import { failureText } from "../../i18n/failure_text"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { useText } from "../../i18n/use_text"
import { Notice } from "../../ui/Notice"
import styles from "./AccountPanel.module.css"

function AccountPanel() {
  const text = useText()
  const locale = useLocale()
  const account = useQuery(accountQuery())
  const session = useQuery(sessionQuery())
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" })

  return (
    <section className={styles.panel} aria-labelledby="account-title">
      <h1 id="account-title" className={styles.title}>
        {text["account.title"]}
      </h1>
      {account.error === null ? null : <Notice tone="problem">{failureText(account.error.failure, text)}</Notice>}
      <dl className={styles.facts}>
        <dt>{text["account.email"]}</dt>
        <dd>{account.data?.email ?? "…"}</dd>
        <dt>{text["account.role"]}</dt>
        <dd>{account.data?.role ?? "…"}</dd>
        <dt>{text["account.userId"]}</dt>
        <dd className={styles.mono}>{account.data === undefined ? "…" : String(account.data.userId)}</dd>
        <dt>{text["account.principal"]}</dt>
        <dd className={styles.mono}>{account.data?.principalId ?? "…"}</dd>
        <dt>{text["account.sessionEnds"]}</dt>
        <dd>
          {session.data?.authenticated === true
            ? formatText(text["account.sessionEndsValue"], { time: time.format(session.data.expiresAt) })
            : "…"}
        </dd>
      </dl>
    </section>
  )
}

export { AccountPanel }
