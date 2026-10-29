import { Moped } from "@phosphor-icons/react"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { CourierApplication } from "../../types/courier_application.type"
import type { DecisionKind } from "../../types/decision_kind.type"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import { ApplicantContact } from "./ApplicantContact"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"
import { DecisionActions } from "./DecisionActions"
import { FieldList } from "./FieldList"
import { statusLabel, statusTone } from "./status_tone"

function CourierDetail({
  application,
  onAsk
}: {
  application: CourierApplication
  onAsk: (kind: DecisionKind) => void
}) {
  const text = useApprovalsText()
  const locale = useLocale()

  return (
    <article className={styles.detail} aria-labelledby="application-title">
      <header className={styles.detailHead}>
        <p className={styles.detailKicker}>
          <span>{formatText(text["approvals.couriers.kicker"], { number: String(application.applicationId) })}</span>
          <StatusTag tone={statusTone(application.status)}>{text[statusLabel[application.status]]}</StatusTag>
        </p>
        <h2 id="application-title" className={styles.detailTitle}>
          {application.email}
        </h2>
        <p className={styles.detailLead}>
          {text["approvals.field.filed"]} <RelativeTime instant={application.filedAt} />
        </p>
      </header>
      <section className={styles.section} aria-labelledby="fleet-title">
        <h3 id="fleet-title" className={styles.sectionTitle}>
          <Moped aria-hidden="true" />
          {text["approvals.section.fleet"]}
        </h3>
        <FieldList
          fields={[
            {
              label: text["approvals.field.driver"],
              value: application.driverId === null ? "—" : String(application.driverId),
              mono: true
            },
            {
              label: text["approvals.field.filedAt"],
              value: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
                application.filedAt
              )
            }
          ]}
        />
      </section>
      <ApplicantContact userId={application.userId} email={application.email} principalId={application.principalId} />
      {application.status === "pending" ? (
        <DecisionActions canReject={false} onAsk={onAsk} />
      ) : (
        <p className={styles.decided}>
          {text["approvals.decided.approved"]}{" "}
          {application.approvedAt === null ? null : <RelativeTime instant={application.approvedAt} />}
        </p>
      )}
    </article>
  )
}

export { CourierDetail }
