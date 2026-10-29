import { useQuery, useQueryClient } from "@tanstack/react-query"
import { m } from "motion/react"
import { useEffect, useState } from "react"
import { BffError } from "../../api/bff_error"
import { accountQuery, sessionQuery } from "../../api/session_query"
import { failureText } from "../../i18n/failure_text"
import { formatDuration } from "../../i18n/format_duration"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { BffFailure } from "../../types/bff_failure.type"
import { Button } from "../../ui/Button"
import { Drawing } from "../../ui/drawing/Drawing"
import { ClockCountdown } from "../../ui/icons/ClockCountdown"
import { IdentificationBadge } from "../../ui/icons/IdentificationBadge"
import { SignOut } from "../../ui/icons/SignOut"
import { Timer } from "../../ui/icons/Timer"
import { enter, stagger } from "../../ui/motion/motion_presets"
import { Notice } from "../../ui/Notice"
import { PageHeader } from "../../ui/PageHeader"
import { useNow } from "../../ui/use_now"
import { usePresence } from "../../ui/use_presence"
import { SecurityPanel } from "../passkeys/SecurityPanel"
import styles from "./AccountPage.module.css"
import { useAccountText } from "./account_text"
import { IdentityCard } from "./IdentityCard"
import { sessionFuseModel } from "./session_fuse_model"
import { absoluteSeconds, idleSeconds } from "./session_lifetimes"
import { useSignOut } from "./use_sign_out"

const idleMinutes = idleSeconds / 60

const columns = { hidden: {}, shown: { transition: { staggerChildren: stagger } } }

const column = { hidden: { opacity: 0, y: 10 }, shown: { opacity: 1, y: 0, transition: enter } }

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function AccountPage() {
  const text = useAccountText()
  const locale = useLocale()
  const queryClient = useQueryClient()
  const poll = usePresence()
  const account = useQuery(accountQuery())
  const session = useQuery({ ...sessionQuery(), refetchInterval: poll ? 60_000 : false })
  const now = useNow(true, 1000)
  const { signOut, pending: signingOut, failure: signOutFailure } = useSignOut()
  const [model] = useState(() => sessionFuseModel({ reducedMotion: prefersReducedMotion(), cells: idleMinutes }))
  const [staying, setStaying] = useState(false)
  const [stayed, setStayed] = useState(false)
  const [stayFailure, setStayFailure] = useState<BffFailure | null>(null)
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" })
  const endsAt = session.data?.authenticated === true ? session.data.expiresAt : null
  const remaining = endsAt === null ? null : Math.max(0, endsAt.getTime() - now)
  const minutesLeft = remaining === null ? null : Math.min(idleMinutes, Math.ceil(remaining / 60_000))

  useEffect(() => {
    if (minutesLeft !== null) {
      model.show(minutesLeft)
    }
  }, [model, minutesLeft])

  async function stay(): Promise<void> {
    setStaying(true)
    setStayed(false)
    setStayFailure(null)

    try {
      await queryClient.fetchQuery({ ...accountQuery(), staleTime: 0 })
      await queryClient.refetchQueries({ queryKey: sessionQuery().queryKey })
      setStayed(true)
    } catch (error) {
      if (!(error instanceof BffError)) {
        throw error
      }

      setStayFailure(error.failure)
    } finally {
      setStaying(false)
    }
  }

  return (
    <>
      <PageHeader eyebrow={text["nav.workspace"]} title={text["account.title"]} lead={text["account.lead"]} />
      {account.error === null ? null : <Notice tone="problem">{failureText(account.error.failure, text)}</Notice>}
      <m.div className={styles.layout} variants={columns} initial="hidden" animate="shown">
        <m.section className={styles.identity} variants={column} aria-labelledby="identity-title">
          <p className={styles.kicker}>
            <IdentificationBadge aria-hidden="true" />
            {text["account.identity"]}
          </p>
          <IdentityCard account={account.data} />
        </m.section>
        <m.section className={styles.session} variants={column} aria-labelledby="session-title">
          <p className={styles.kicker}>
            <ClockCountdown aria-hidden="true" />
            <span id="session-title">{text["account.sessionTitle"]}</span>
          </p>
          <p className={styles.countdown}>
            <span className={styles.clock}>{remaining === null ? "–:––" : formatDuration(remaining)}</span>
            <span className={styles.clockLabel}>{text["account.left"]}</span>
          </p>
          <p className={styles.endsAt}>
            {endsAt === null
              ? "…"
              : formatText(text["account.endsAt"], {
                  time: time.format(endsAt),
                  hours: String(absoluteSeconds / 3600)
                })}
          </p>
          <figure className={styles.figure}>
            <Drawing
              model={model}
              media="(min-width: 48rem)"
              className={styles.drawing}
              fallback={<Timer size={48} weight="thin" />}
            />
            <dl className={styles.legend}>
              <div>
                <dt>{text["account.fuse.left"]}</dt>
                <dd data-tone="attention">{minutesLeft === null ? "—" : String(minutesLeft)}</dd>
              </div>
              <div>
                <dt>{text["account.fuse.ends"]}</dt>
                <dd>{endsAt === null ? "—" : time.format(endsAt)}</dd>
              </div>
              <div>
                <dt>{text["account.fuse.limit"]}</dt>
                <dd>{formatText(text["account.minutes"], { minutes: String(idleMinutes) })}</dd>
              </div>
            </dl>
          </figure>
          {stayed && endsAt !== null ? (
            <Notice tone="info">{formatText(text["account.stayed"], { time: time.format(endsAt) })}</Notice>
          ) : null}
          {stayFailure === null ? null : <Notice tone="problem">{failureText(stayFailure, text)}</Notice>}
          {signOutFailure === null ? null : <Notice tone="problem">{text["signOut.failed"]}</Notice>}
          <div className={styles.actions}>
            <Button isDisabled={staying} onPress={() => void stay()}>
              <Timer aria-hidden="true" />
              {staying ? text["account.staying"] : text["account.stay"]}
            </Button>
            <Button variant="secondary" isDisabled={signingOut} onPress={() => void signOut()}>
              <SignOut aria-hidden="true" />
              {text["account.signOut"]}
            </Button>
          </div>
        </m.section>
      </m.div>
      {account.data === undefined ? null : (
        <SecurityPanel userId={account.data.userId} principalId={account.data.principalId} />
      )}
    </>
  )
}

export { AccountPage }
