import { useForm } from "@tanstack/react-form"
import { useState } from "react"
import { bffRequest } from "../../api/bff_request"
import { loginCall } from "../../api/calls/login_call"
import { formatText } from "../../i18n/format_text"
import { noticeText } from "../../i18n/notice_text"
import { useText } from "../../i18n/use_text"
import type { SignInEvent } from "../../types/sign_in_event.type"
import type { SignInNotice } from "../../types/sign_in_notice.type"
import { Button } from "../../ui/Button"
import { Notice } from "../../ui/Notice"
import { TextField } from "../../ui/TextField"
import { endsPending } from "./ends_pending"
import { fieldError } from "./field_error"
import { refusalText } from "./refusal_text"
import { retryAt } from "./retry_at"
import styles from "./SignIn.module.css"
import { emailSchema, passwordSchema } from "./sign_in_schemas"
import { useRetryGate } from "./use_retry_gate"

function CredentialsStep({
  notice,
  dispatch
}: {
  notice: SignInNotice | null
  dispatch: (event: SignInEvent) => void
}) {
  const text = useText()
  const [problem, setProblem] = useState<string | null>(null)
  const { remainingSeconds, blockUntil } = useRetryGate()
  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setProblem(null)
      const result = await bffRequest(loginCall(value.email.trim(), value.password))
      if (result.ok) {
        dispatch({ type: "password-accepted", outcome: result.value, now: Date.now() })
        return
      }

      const ended = endsPending(result.failure)
      if (ended === "role-refused") {
        dispatch({ type: "pending-ended", notice: ended })
        return
      }

      blockUntil(retryAt(result.failure, Date.now()))
      setProblem(refusalText(result.failure, text))
    }
  })

  return (
    <section className={styles.panel} aria-labelledby="sign-in-title">
      <h1 id="sign-in-title" className={styles.title}>
        {text["signIn.title"]}
      </h1>
      <p className={styles.lead}>{text["signIn.lead"]}</p>
      {notice === null ? null : (
        <Notice tone={notice === "role-refused" || notice === "pending-ended" ? "problem" : "info"}>
          {noticeText(notice, text)}
        </Notice>
      )}
      {problem === null ? null : <Notice tone="problem">{problem}</Notice>}
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field name="email" validators={{ onSubmit: emailSchema, onBlur: emailSchema }}>
          {(field) => (
            <TextField
              label={text["signIn.email"]}
              name={field.name}
              type="email"
              autoComplete="username"
              inputMode="email"
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={fieldError(field.state.meta.errors, text)}
              validationBehavior="aria"
              isRequired
            />
          )}
        </form.Field>
        <form.Field name="password" validators={{ onSubmit: passwordSchema }}>
          {(field) => (
            <TextField
              label={text["signIn.password"]}
              name={field.name}
              type="password"
              autoComplete="current-password"
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
                    : text["signIn.submit"]}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </section>
  )
}

export { CredentialsStep }
