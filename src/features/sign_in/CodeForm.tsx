import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { formatText } from "../../i18n/format_text"
import { useText } from "../../i18n/use_text"
import type { BffFailure } from "../../types/bff_failure.type"
import { Button } from "../../ui/Button"
import { Notice } from "../../ui/Notice"
import { TextField } from "../../ui/TextField"
import { fieldError } from "./field_error"
import { refusalText } from "./refusal_text"
import { retryAt } from "./retry_at"
import styles from "./SignIn.module.css"
import { codeSchema } from "./sign_in_schemas"
import { useRetryGate } from "./use_retry_gate"

function CodeForm({
  submitLabel,
  onCode
}: {
  submitLabel: string
  onCode: (code: string) => Promise<BffFailure | null>
}) {
  const text = useText()
  const [problem, setProblem] = useState<string | null>(null)
  const { remainingSeconds, blockUntil } = useRetryGate()
  const form = useForm({
    defaultValues: { code: "" },
    onSubmit: async ({ value, formApi }) => {
      setProblem(null)
      const failure = await onCode(value.code.replace(/\s/g, ""))
      if (failure === null) {
        return
      }

      blockUntil(retryAt(failure, Date.now()))
      setProblem(refusalText(failure, text))
      formApi.reset()
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      {problem === null ? null : <Notice tone="problem">{problem}</Notice>}
      <form.Field name="code" validators={{ onSubmit: codeSchema }}>
        {(field) => (
          <TextField
            label={text["code.label"]}
            description={text["code.description"]}
            name={field.name}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={16}
            code
            value={field.state.value}
            onChange={field.handleChange}
            onBlur={field.handleBlur}
            error={fieldError(field.state.meta.errors, text)}
            validationBehavior="aria"
            isRequired
          />
        )}
      </form.Field>
      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(submitting) => (
          <div className={styles.actions}>
            <Button type="submit" isDisabled={submitting || remainingSeconds > 0}>
              {remainingSeconds > 0
                ? formatText(text["signIn.retryIn"], { seconds: String(remainingSeconds) })
                : submitting
                  ? text["signIn.submitting"]
                  : submitLabel}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}

export { CodeForm }
