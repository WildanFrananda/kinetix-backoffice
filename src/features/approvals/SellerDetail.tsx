import { formatText } from "../../i18n/format_text"
import type { DecisionKind } from "../../types/decision_kind.type"
import type { SellerApplication } from "../../types/seller_application.type"
import { Buildings } from "../../ui/icons/Buildings"
import { MapPin } from "../../ui/icons/MapPin"
import { RelativeTime } from "../../ui/RelativeTime"
import { StatusTag } from "../../ui/StatusTag"
import { ApplicantContact } from "./ApplicantContact"
import styles from "./Approvals.module.css"
import { useApprovalsText } from "./approvals_text"
import { DecisionActions } from "./DecisionActions"
import { FieldList } from "./FieldList"
import { statusLabel, statusTone } from "./status_tone"

function SellerDetail({ application, onAsk }: { application: SellerApplication; onAsk: (kind: DecisionKind) => void }) {
  const text = useApprovalsText()
  const decidedAt = application.status === "rejected" ? application.rejectedAt : application.verifiedAt

  return (
    <article className={styles.detail} aria-labelledby="application-title">
      <header className={styles.detailHead}>
        <p className={styles.detailKicker}>
          <span>{formatText(text["approvals.sellers.kicker"], { number: String(application.applicationId) })}</span>
          <StatusTag tone={statusTone(application.status)}>{text[statusLabel[application.status]]}</StatusTag>
        </p>
        <h2 id="application-title" className={styles.detailTitle}>
          {application.storeName}
        </h2>
        <p className={styles.detailLead}>{application.email}</p>
      </header>
      <section className={styles.section} aria-labelledby="business-title">
        <h3 id="business-title" className={styles.sectionTitle}>
          <Buildings aria-hidden="true" />
          {text["approvals.section.business"]}
        </h3>
        <FieldList
          fields={[
            {
              label: text["approvals.field.registration"],
              value: application.businessRegistrationNumber,
              mono: true
            },
            { label: text["approvals.field.taxId"], value: application.taxId, mono: true }
          ]}
        />
      </section>
      <section className={styles.section} aria-labelledby="address-title">
        <h3 id="address-title" className={styles.sectionTitle}>
          <MapPin aria-hidden="true" />
          {text["approvals.section.address"]}
        </h3>
        <FieldList
          fields={[
            { label: text["approvals.field.street"], value: application.streetAddress },
            { label: text["approvals.field.city"], value: application.city },
            { label: text["approvals.field.postalCode"], value: application.postalCode, mono: true }
          ]}
        />
      </section>
      <ApplicantContact userId={application.userId} email={application.email} principalId={application.principalId} />
      {application.status === "pending" ? (
        <DecisionActions canReject onAsk={onAsk} />
      ) : (
        <p className={styles.decided}>
          {application.status === "rejected" ? text["approvals.decided.rejected"] : text["approvals.decided.verified"]}{" "}
          {decidedAt === null ? null : <RelativeTime instant={decidedAt} />}
        </p>
      )}
    </article>
  )
}

export { SellerDetail }
