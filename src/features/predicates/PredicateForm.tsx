import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { approvePredicateCall } from "../../api/calls/approve_predicate_call"
import { fieldError } from "../../i18n/field_error"
import type { PredicateDraft } from "../../types/predicate_draft.type"
import type { PredicateListing } from "../../types/predicate_listing.type"
import type { PredicateReport } from "../../types/predicate_report.type"
import { Button } from "../../ui/Button"
import { Plus } from "../../ui/icons/Plus"
import { SealCheck } from "../../ui/icons/SealCheck"
import { Notice } from "../../ui/Notice"
import { TextField } from "../../ui/TextField"
import styles from "./Predicates.module.css"
import { predicateFailure } from "./predicate_failure"
import {
  daysActiveSchema,
  deliveriesSchema,
  freshnessSchema,
  labelSchema,
  ratingHundredthsOf,
  ratingSchema
} from "./predicate_rules"
import { predicatesKey } from "./predicates_queries"
import { usePredicatesText } from "./predicates_text"

function PredicateForm({ onDone, onCancel }: { onDone: (report: PredicateReport) => void; onCancel: () => void }) {
  const text = usePredicatesText()
  const queryClient = useQueryClient()

  const approve = useMutation({
    mutationFn: (draft: PredicateDraft) => bffFetch(approvePredicateCall(draft)),
    onSuccess: (approved) => {
      queryClient.setQueryData<PredicateListing>(predicatesKey, (listing) =>
        listing === undefined ? listing : { ...listing, predicates: [...listing.predicates, approved] }
      )

      void queryClient.invalidateQueries({ queryKey: predicatesKey })
      onDone({ kind: "approved", id: approved.id, label: approved.label })
    }
  })

  const form = useForm({
    defaultValues: { label: "", deliveries: "", rating: "", daysActive: "", freshnessDays: "30" },
    onSubmit: ({ value }) => {
      approve.mutate({
        label: value.label.trim(),
        minimums: {
          deliveries: Number(value.deliveries.trim()),
          ratingHundredths: ratingHundredthsOf(value.rating),
          daysActive: Number(value.daysActive.trim())
        },
        freshnessDays: Number(value.freshnessDays.trim())
      })
    }
  })

  const failure = approve.error instanceof BffError ? predicateFailure(approve.error.failure, text) : null

  return (
    <article className={styles.editor} aria-labelledby="predicate-title">
      <header className={styles.editorHead}>
        <p className={styles.kicker}>
          <SealCheck aria-hidden="true" />
          {text["predicates.detail.kicker"]}
        </p>
        <h2 id="predicate-title" className={styles.editorTitle}>
          {text["predicates.create.title"]}
        </h2>
        <p className={styles.editorLead}>{text["predicates.create.lead"]}</p>
      </header>
      <form
        noValidate
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field name="label" validators={{ onSubmit: labelSchema, onBlur: labelSchema }}>
          {(field) => (
            <TextField
              label={text["predicates.field.label"]}
              description={text["predicates.field.labelHint"]}
              name={field.name}
              autoComplete="off"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta.errors, text)}
              validationBehavior="aria"
              isRequired
            />
          )}
        </form.Field>
        <form.Field name="deliveries" validators={{ onSubmit: deliveriesSchema, onBlur: deliveriesSchema }}>
          {(field) => (
            <TextField
              label={text["predicates.field.deliveries"]}
              name={field.name}
              inputMode="numeric"
              autoComplete="off"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta.errors, text)}
              validationBehavior="aria"
              isRequired
            />
          )}
        </form.Field>
        <form.Field name="rating" validators={{ onSubmit: ratingSchema, onBlur: ratingSchema }}>
          {(field) => (
            <TextField
              label={text["predicates.field.rating"]}
              description={text["predicates.field.ratingHint"]}
              name={field.name}
              inputMode="decimal"
              autoComplete="off"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta.errors, text)}
              validationBehavior="aria"
              isRequired
            />
          )}
        </form.Field>
        <form.Field name="daysActive" validators={{ onSubmit: daysActiveSchema, onBlur: daysActiveSchema }}>
          {(field) => (
            <TextField
              label={text["predicates.field.days"]}
              name={field.name}
              inputMode="numeric"
              autoComplete="off"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta.errors, text)}
              validationBehavior="aria"
              isRequired
            />
          )}
        </form.Field>
        <form.Field name="freshnessDays" validators={{ onSubmit: freshnessSchema, onBlur: freshnessSchema }}>
          {(field) => (
            <TextField
              label={text["predicates.field.freshness"]}
              description={text["predicates.field.freshnessHint"]}
              name={field.name}
              inputMode="numeric"
              autoComplete="off"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta.errors, text)}
              validationBehavior="aria"
              isRequired
            />
          )}
        </form.Field>
        {failure === null ? null : (
          <Notice tone="problem">
            {failure.lead}
            {failure.quote === null ? null : (
              <q className={styles.quote} lang="en">
                {failure.quote}
              </q>
            )}
          </Notice>
        )}
        <div className={styles.formActions}>
          <Button type="submit" isDisabled={approve.isPending}>
            <Plus aria-hidden="true" />
            {approve.isPending ? text["predicates.create.submitting"] : text["predicates.create.submit"]}
          </Button>
          <Button variant="secondary" isDisabled={approve.isPending} onPress={onCancel}>
            {text["predicates.cancel"]}
          </Button>
        </div>
      </form>
    </article>
  )
}

export { PredicateForm }
