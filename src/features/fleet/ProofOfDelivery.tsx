import { useState } from "react"
import { formatText } from "../../i18n/format_text"
import type { DispatchJob } from "../../types/dispatch_job.type"
import { Button } from "../../ui/Button"
import styles from "./Fleet.module.css"
import { useFleetText } from "./fleet_text"
import { SignatureImage } from "./SignatureImage"

function ProofOfDelivery({ job, onReadAgain }: { job: DispatchJob; onReadAgain: () => void }) {
  const text = useFleetText()
  const [broken, setBroken] = useState<string | null>(null)
  const photo = job.proof?.photoUrl ?? null
  const signature = job.proof?.signature ?? null
  const values = { job: String(job.id) }

  function photoBody() {
    if (photo === null) {
      return <p className={styles.proofNone}>{text["dispatch.proof.photoNone"]}</p>
    }

    if (broken === photo) {
      return (
        <div className={styles.proofBroken}>
          <p className={styles.proofNone}>{text["dispatch.proof.photoBroken"]}</p>
          <Button variant="secondary" onPress={onReadAgain}>
            {text["dispatch.report.readAgain"]}
          </Button>
        </div>
      )
    }

    return (
      <img
        className={styles.photo}
        src={photo}
        alt={formatText(text["dispatch.proof.photoAlt"], values)}
        referrerPolicy="no-referrer"
        decoding="async"
        onError={() => setBroken(photo)}
      />
    )
  }

  return (
    <section className={styles.section} aria-labelledby="proof-title">
      <h3 id="proof-title" className={styles.sectionTitle}>
        {text["dispatch.proof.title"]}
      </h3>
      <div className={styles.proof}>
        <figure className={styles.proofItem}>
          <figcaption className={styles.proofLabel}>{text["dispatch.proof.photo"]}</figcaption>
          {photoBody()}
        </figure>
        <figure className={styles.proofItem}>
          <figcaption className={styles.proofLabel}>{text["dispatch.proof.signature"]}</figcaption>
          {signature === null ? (
            <p className={styles.proofNone}>{text["dispatch.proof.signatureNone"]}</p>
          ) : (
            <SignatureImage
              key={signature}
              dataUri={signature}
              label={formatText(text["dispatch.proof.signatureAlt"], values)}
              unreadable={text["dispatch.proof.signatureUnreadable"]}
            />
          )}
        </figure>
      </div>
    </section>
  )
}

export { ProofOfDelivery }
