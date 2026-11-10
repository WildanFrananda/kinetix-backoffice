import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { withdrawPredicateCall } from "../../api/calls/withdraw_predicate_call"
import { formatText } from "../../i18n/format_text"
import { useLocale } from "../../i18n/use_locale"
import type { Predicate } from "../../types/predicate.type"
import type { PredicateListing } from "../../types/predicate_listing.type"
import type { PredicateReport } from "../../types/predicate_report.type"
import { Button } from "../../ui/Button"
import { SealCheck } from "../../ui/icons/SealCheck"
import { Trash } from "../../ui/icons/Trash"
import styles from "./Predicates.module.css"
import { predicateFailure } from "./predicate_failure"
import { dayOf, momentOf, ratingOf } from "./predicate_format"
import { predicatesKey } from "./predicates_queries"
import { usePredicatesText } from "./predicates_text"
import { WithdrawPredicateDialog } from "./WithdrawPredicateDialog"

function PredicateDetail({
  predicate,
  withdrawRequest,
  onDone
}: {
  predicate: Predicate
  withdrawRequest: number
  onDone: (report: PredicateReport) => void
}) {
  const text = usePredicatesText()
  const locale = useLocale()
  const numbers = new Intl.NumberFormat(locale)
  const queryClient = useQueryClient()
  const [asking, setAsking] = useState(false)
  const handled = useRef(withdrawRequest)

  useEffect(() => {
    if (withdrawRequest === handled.current) {
      return
    }

    handled.current = withdrawRequest
    setAsking(true)
  }, [withdrawRequest])

  const withdraw = useMutation({
    mutationFn: () => bffFetch(withdrawPredicateCall(predicate.id)),
    onSuccess: () => {
      queryClient.setQueryData<PredicateListing>(predicatesKey, (listing) =>
        listing === undefined
          ? listing
          : { ...listing, predicates: listing.predicates.filter((candidate) => candidate.id !== predicate.id) }
      )

      void queryClient.invalidateQueries({ queryKey: predicatesKey })
      setAsking(false)
      onDone({ kind: "withdrawn", id: predicate.id, label: predicate.label })
    },
    onError: (error) => {
      if (error instanceof BffError && error.failure.kind === "refused" && error.failure.status === 404) {
        void queryClient.invalidateQueries({ queryKey: predicatesKey })
      }
    }
  })

  const failure = withdraw.error instanceof BffError ? predicateFailure(withdraw.error.failure, text) : null

  return (
    <article className={styles.editor} aria-labelledby="predicate-title">
      <header className={styles.editorHead}>
        <p className={styles.kicker}>
          <SealCheck aria-hidden="true" />
          {text["predicates.detail.kicker"]}
        </p>
        <h2 id="predicate-title" className={styles.editorTitle}>
          {predicate.label}
        </h2>
        <p className={styles.editorLead}>
          {formatText(text["predicates.detail.approved"], { when: momentOf(predicate.approvedAt, locale) })}
        </p>
      </header>
      <dl className={styles.facts}>
        <dt>{text["predicates.detail.deliveries"]}</dt>
        <dd>{numbers.format(predicate.minimums.deliveries)}</dd>
        <dt>{text["predicates.detail.rating"]}</dt>
        <dd>{ratingOf(predicate.minimums.ratingHundredths, locale)}</dd>
        <dt>{text["predicates.detail.days"]}</dt>
        <dd>{numbers.format(predicate.minimums.daysActive)}</dd>
        <dt>{text["predicates.detail.freshness"]}</dt>
        <dd>
          {formatText(text["predicates.detail.freshnessValue"], { days: numbers.format(predicate.freshnessDays) })}
        </dd>
      </dl>
      <section aria-labelledby="rows-title">
        <h3 id="rows-title" className={styles.sectionTitle}>
          {text["predicates.rows.title"]}
        </h3>
        <p className={styles.note}>{text["predicates.rows.lead"]}</p>
        <table className={styles.rows}>
          <thead>
            <tr>
              <th scope="col">{text["predicates.rows.week"]}</th>
              <th scope="col">{text["predicates.rows.state"]}</th>
            </tr>
          </thead>
          <tbody>
            {predicate.rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {dayOf(row.minimumIssueDate, locale)}{" "}
                  <span className={styles.placing}>
                    ({row.current ? text["predicates.rows.current"] : text["predicates.rows.previous"]})
                  </span>
                </td>
                <td className={row.placed ? styles.placed : styles.placing}>
                  {row.placed ? text["predicates.state.placed"] : text["predicates.state.placing"]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className={styles.danger} aria-labelledby="withdraw-title">
        <h3 id="withdraw-title" className={styles.sectionTitle}>
          {text["predicates.withdraw.section"]}
        </h3>
        <p className={styles.dangerBody}>{text["predicates.withdraw.body"]}</p>
        <div>
          <Button
            variant="secondary"
            onPress={() => {
              withdraw.reset()
              setAsking(true)
            }}
          >
            <Trash aria-hidden="true" />
            {text["predicates.withdraw.open"]}
          </Button>
        </div>
        <WithdrawPredicateDialog
          open={asking}
          label={predicate.label}
          pending={withdraw.isPending}
          failure={failure}
          onConfirm={() => withdraw.mutate()}
          onClose={() => setAsking(false)}
        />
      </section>
    </article>
  )
}

export { PredicateDetail }
