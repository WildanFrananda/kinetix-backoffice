import { useQuery } from "@tanstack/react-query"
import { CopyValue } from "../../ui/CopyValue"
import { UserCircle } from "../../ui/icons/UserCircle"
import styles from "./Approvals.module.css"
import { applicantProfileQuery } from "./approvals_queries"
import { useApprovalsText } from "./approvals_text"
import { FieldList } from "./FieldList"
import { useSettled } from "./use_settled"

function ApplicantContact({
  userId,
  email,
  principalId
}: {
  userId: number
  email: string
  principalId: string | null
}) {
  const text = useApprovalsText()
  const settled = useSettled(userId, 350)
  const profile = useQuery({ ...applicantProfileQuery(userId), enabled: settled === userId })

  function contactValue(field: "fullName" | "phoneNumber") {
    if (profile.isError) {
      return <span className={styles.quiet}>{text["approvals.profile.failed"]}</span>
    }

    if (profile.data === undefined) {
      return <span className={styles.quiet}>{text["approvals.profile.loading"]}</span>
    }

    if (profile.data === null) {
      return <span className={styles.quiet}>{text["approvals.profile.none"]}</span>
    }

    const value = profile.data[field]

    return value.length > 0 ? value : <span className={styles.quiet}>—</span>
  }

  return (
    <section className={styles.section} aria-labelledby="applicant-title">
      <h3 id="applicant-title" className={styles.sectionTitle}>
        <UserCircle aria-hidden="true" />
        {text["approvals.section.applicant"]}
      </h3>
      <FieldList
        fields={[
          { label: text["approvals.field.name"], value: contactValue("fullName") },
          { label: text["approvals.field.phone"], value: contactValue("phoneNumber"), mono: true },
          { label: text["approvals.field.email"], value: email },
          { label: text["approvals.field.userId"], value: String(userId), mono: true },
          {
            label: text["approvals.field.principal"],
            value:
              principalId === null ? (
                <span className={styles.quiet}>{text["approvals.principal.none"]}</span>
              ) : (
                <CopyValue value={principalId} label={text["approvals.field.principal"]} />
              )
          }
        ]}
      />
    </section>
  )
}

export { ApplicantContact }
