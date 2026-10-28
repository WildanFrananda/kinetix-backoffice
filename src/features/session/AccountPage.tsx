import { useQuery } from "@tanstack/react-query"
import { accountQuery, sessionQuery } from "../../api/session_query"
import { failureText } from "../../i18n/failure_text"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import { useText } from "../../i18n/use_text"
import { Notice } from "../../ui/Notice"
import { PageHeader } from "../../ui/PageHeader"
import styles from "./AccountPage.module.css"

function AccountPage() {
  const text = useText()
  const locale = useLocale()
  const account = useQuery(accountQuery())
  const session = useQuery(sessionQuery())
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" })
  const endsAt = session.data?.authenticated === true ? session.data.expiresAt : null

  return (
    <>
      <PageHeader eyebrow={text["nav.workspace"]} title={text["account.title"]} lead={text["account.lead"]} />
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
        <dd>{endsAt === null ? "…" : formatText(text["account.sessionEndsValue"], { time: time.format(endsAt) })}</dd>
      </dl>
    </>
  )
}

export { AccountPage }
