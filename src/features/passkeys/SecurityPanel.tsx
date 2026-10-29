import { useQuery } from "@tanstack/react-query"
import { m } from "motion/react"
import { useState } from "react"
import { BffError } from "../../api/bff_error"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { Passkey } from "../../types/passkey.type"
import type { SecurityReport } from "../../types/security_report.type"
import { Button } from "../../ui/Button"
import { Fingerprint } from "../../ui/icons/Fingerprint"
import { Key } from "../../ui/icons/Key"
import { ShieldCheck } from "../../ui/icons/ShieldCheck"
import { Trash } from "../../ui/icons/Trash"
import { enter } from "../../ui/motion/motion_presets"
import { Notice } from "../../ui/Notice"
import { PanelProblem } from "../../ui/PanelProblem"
import { RelativeTime } from "../../ui/RelativeTime"
import { useAccountText } from "../session/account_text"
import { PasskeyDialog } from "./PasskeyDialog"
import styles from "./Passkeys.module.css"
import { passkeysQuery } from "./passkey_queries"
import { supportsPasskeys } from "./webauthn"

function SecurityPanel({ userId }: { userId: number }) {
  const text = useAccountText()
  const date = new Intl.DateTimeFormat(useLocale(), { day: "numeric", month: "short", year: "numeric" })
  const passkeys = useQuery(passkeysQuery(userId))
  const [dialog, setDialog] = useState<{ removing: Passkey | null } | null>(null)
  const [report, setReport] = useState<SecurityReport | null>(null)
  const capable = supportsPasskeys()

  function list() {
    if (passkeys.isPending) {
      return <p className={styles.state}>{text["account.security.loading"]}</p>
    }

    if (passkeys.isError) {
      return (
        <PanelProblem
          failure={passkeys.error instanceof BffError ? passkeys.error.failure : null}
          onRetry={() => void passkeys.refetch()}
        />
      )
    }

    if (passkeys.data.length === 0) {
      return <p className={styles.state}>{text["account.security.none"]}</p>
    }

    return (
      <ul className={styles.keys}>
        {passkeys.data.map((passkey) => (
          <li key={passkey.id} className={styles.key}>
            <Key aria-hidden="true" className={styles.keyIcon} />
            <span className={styles.keyName}>{passkey.name}</span>
            <span className={styles.keyMeta}>
              {formatText(text["account.security.added"], { date: date.format(passkey.createdAt) })}
              {" · "}
              {passkey.lastUsedAt === null ? (
                text["account.security.neverUsed"]
              ) : (
                <>
                  {text["account.security.lastUsed"]} <RelativeTime instant={passkey.lastUsedAt} />
                </>
              )}
              {" · "}
              {text[passkey.backedUp ? "account.security.synced" : "account.security.deviceOnly"]}
            </span>
            <Button
              variant="quiet"
              aria-label={formatText(text["account.security.removeLabel"], { name: passkey.name })}
              onPress={() => {
                setReport(null)
                setDialog({ removing: passkey })
              }}
            >
              <Trash aria-hidden="true" />
              {text["account.security.remove"]}
            </Button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section className={styles.panel} aria-labelledby="security-title">
      <p className={styles.kicker}>
        <ShieldCheck aria-hidden="true" />
        <span id="security-title">{text["account.security.title"]}</span>
      </p>
      {report === null ? null : (
        <m.div
          key={`${report.kind}-${report.name}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={enter}
        >
          <Notice tone="info">
            {formatText(
              text[report.kind === "added" ? "account.security.addedNotice" : "account.security.removedNotice"],
              {
                name: report.name
              }
            )}
          </Notice>
        </m.div>
      )}
      <div className={styles.factors}>
        <div className={styles.factor}>
          <h3 className={styles.factorTitle}>{text["account.security.code"]}</h3>
          <p className={styles.status} data-on="true">
            {text["account.security.on"]}
          </p>
          <p className={styles.note}>{text["account.security.codeNote"]}</p>
        </div>
        <div className={styles.factor}>
          <h3 className={styles.factorTitle}>{text["account.security.passkeys"]}</h3>
          {list()}
          <p className={styles.note}>
            {capable ? text["account.security.passkeysNote"] : text["account.security.unsupported"]}
          </p>
          <div>
            <Button
              isDisabled={!capable}
              onPress={() => {
                setReport(null)
                setDialog({ removing: null })
              }}
            >
              <Fingerprint aria-hidden="true" />
              {text["account.security.addButton"]}
            </Button>
          </div>
        </div>
      </div>
      {dialog === null ? null : (
        <PasskeyDialog
          userId={userId}
          removing={dialog.removing}
          onClose={() => setDialog(null)}
          onDone={(next) => {
            setDialog(null)
            setReport(next)
          }}
        />
      )}
    </section>
  )
}

export { SecurityPanel }
