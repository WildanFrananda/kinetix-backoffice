import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type FormEvent, useState } from "react"
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { bffFetch } from "../../api/bff_fetch"
import { passkeyEnrolmentCall } from "../../api/calls/passkey_enrolment_call"
import { registerPasskeyCall } from "../../api/calls/register_passkey_call"
import { removePasskeyCall } from "../../api/calls/remove_passkey_call"
import { formatText } from "../../i18n/format_text"
import type { Passkey } from "../../types/passkey.type"
import type { SecurityReport } from "../../types/security_report.type"
import { Button } from "../../ui/Button"
import { Notice } from "../../ui/Notice"
import { TextField } from "../../ui/TextField"
import { useAccountText } from "../session/account_text"
import styles from "./Passkeys.module.css"
import { passkeyFailure } from "./passkey_failure"
import { passkeysKey } from "./passkey_queries"
import { forgetPasskey, makePasskey, passkeyAlreadyHere, passkeyDeclined, passkeyElsewhere } from "./webauthn"

const nameLimit = 64

function PasskeyDialog({
  userId,
  removing,
  onClose,
  onDone
}: {
  userId: number
  removing: Passkey | null
  onClose: () => void
  onDone: (report: SecurityReport) => void
}) {
  const text = useAccountText()
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [problem, setProblem] = useState<string | null>(null)

  const change = useMutation({
    mutationFn: async (): Promise<SecurityReport> => {
      if (removing !== null) {
        await bffFetch(removePasskeyCall(userId, removing.id, password))

        return { kind: "removed", name: removing.name }
      }

      const enrolment = await bffFetch(passkeyEnrolmentCall(userId, password))
      const credential = await makePasskey(enrolment.options)
      const added = await bffFetch(
        registerPasskeyCall(userId, { challengeId: enrolment.challengeId, name: name.trim(), credential })
      ).catch(async (error: unknown) => {
        if (error instanceof BffError && error.failure.kind === "refused") {
          await forgetPasskey(enrolment.options.rp.id ?? window.location.hostname, credential.id)
        }

        throw error
      })

      return { kind: "added", name: added.name }
    },
    onSuccess: (report) => {
      void queryClient.invalidateQueries({ queryKey: passkeysKey })
      onDone(report)
    },
    onError: (error) => {
      if (error instanceof BffError) {
        setProblem(passkeyFailure(error.failure, text))
        return
      }

      if (passkeyAlreadyHere(error)) {
        setProblem(text["account.security.already"])
        return
      }

      if (passkeyElsewhere(error)) {
        setProblem(text["account.security.elsewhere"])
        return
      }

      setProblem(passkeyDeclined(error) ? text["account.security.declined"] : text["account.security.failed"])
    }
  })

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()

    if (removing === null && (name.trim().length === 0 || [...name.trim()].length > nameLimit)) {
      setProblem(text["account.security.nameRule"])
      return
    }

    if (password.length === 0) {
      setProblem(text["account.security.passwordRule"])
      return
    }

    setProblem(null)
    change.mutate()
  }

  return (
    <ModalOverlay
      isOpen
      isDismissable={!change.isPending}
      isKeyboardDismissDisabled={change.isPending}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      className={styles.overlay}
    >
      <Modal className={styles.modal}>
        <Dialog className={styles.dialog} data-kind={removing === null ? "add" : "remove"}>
          <Heading slot="title" className={styles.dialogTitle}>
            {removing === null
              ? text["account.security.addTitle"]
              : formatText(text["account.security.removeTitle"], { name: removing.name })}
          </Heading>
          <p className={styles.dialogBody}>
            {removing === null ? text["account.security.addBody"] : text["account.security.removeBody"]}
          </p>
          <form noValidate className={styles.form} onSubmit={submit}>
            {removing === null ? (
              <TextField
                label={text["account.security.name"]}
                description={text["account.security.nameHint"]}
                value={name}
                onChange={setName}
                autoComplete="off"
                isRequired
              />
            ) : null}
            <TextField
              label={text["account.security.password"]}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              isRequired
            />
            {problem === null ? null : <Notice tone="problem">{problem}</Notice>}
            <div className={styles.dialogActions}>
              <Button type="submit" variant={removing === null ? "primary" : "secondary"} isDisabled={change.isPending}>
                {change.isPending
                  ? text["account.security.working"]
                  : text[removing === null ? "account.security.add" : "account.security.remove"]}
              </Button>
              <Button
                variant={removing === null ? "secondary" : "primary"}
                autoFocus={removing !== null}
                isDisabled={change.isPending}
                onPress={onClose}
              >
                {text["account.security.cancel"]}
              </Button>
            </div>
          </form>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { PasskeyDialog }
