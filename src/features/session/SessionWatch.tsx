import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Dialog, Heading, Modal, ModalOverlay } from "react-aria-components"
import { BffError } from "../../api/bff_error"
import { accountQuery, sessionQuery } from "../../api/session_query"
import { failureText } from "../../i18n/failure_text"
import { formatDuration } from "../../i18n/format_duration"
import { formatText } from "../../i18n/format_text"
import { useText } from "../../i18n/use_text"
import type { BffFailure } from "../../types/bff_failure.type"
import { Button } from "../../ui/Button"
import { Notice } from "../../ui/Notice"
import { useNow } from "../../ui/use_now"
import styles from "./SessionWatch.module.css"
import { listenForSessionSignals } from "./session_channel"
import { useSignOut } from "./use_sign_out"

const warningMs = 120_000

function SessionWatch() {
  const text = useText()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const href = useRouterState({ select: (state) => state.location.href })
  const session = useQuery(sessionQuery())
  const { signOut, pending } = useSignOut()
  const [warning, setWarning] = useState(false)
  const [staying, setStaying] = useState(false)
  const [stayFailure, setStayFailure] = useState<BffFailure | null>(null)
  const now = useNow(warning)
  const expiresAt = session.data?.authenticated === true ? session.data.expiresAt.getTime() : null

  useEffect(() => {
    if (session.data?.authenticated === false) {
      void navigate({ to: "/sign-in", search: { redirect: href, notice: "session-ended" } })
    }
  }, [session.data, navigate, href])

  useEffect(() => {
    if (expiresAt === null) {
      return
    }

    const delay = expiresAt - warningMs - Date.now()
    const timer = window.setTimeout(
      () => {
        queryClient.query(sessionQuery()).then(
          (fresh) => {
            if (fresh.authenticated && fresh.expiresAt.getTime() - Date.now() <= warningMs) {
              setWarning(true)
            }
          },
          () => setWarning(true)
        )
      },
      Math.max(0, delay)
    )

    return () => window.clearTimeout(timer)
  }, [expiresAt, queryClient])

  useEffect(() => {
    if (warning && expiresAt !== null && now >= expiresAt) {
      setWarning(false)
      void queryClient.invalidateQueries({ queryKey: sessionQuery().queryKey })
    }
  }, [warning, expiresAt, now, queryClient])

  useEffect(() => {
    return listenForSessionSignals((signal) => {
      if (signal.type === "signed-out") {
        queryClient.clear()
        void navigate({ to: "/sign-in", search: { notice: "signed-out" } })
      }
    })
  }, [queryClient, navigate])

  async function stay(): Promise<void> {
    setStaying(true)
    setStayFailure(null)
    try {
      await queryClient.fetchQuery({ ...accountQuery(), staleTime: 0 })
      await queryClient.invalidateQueries({ queryKey: sessionQuery().queryKey })
      setWarning(false)
    } catch (error) {
      if (error instanceof BffError) {
        setStayFailure(error.failure)
      } else {
        throw error
      }
    } finally {
      setStaying(false)
    }
  }

  return (
    <ModalOverlay isOpen={warning} isDismissable={false} className={styles.overlay}>
      <Modal>
        <Dialog role="alertdialog" className={styles.dialog}>
          <Heading slot="title" className={styles.title}>
            {text["expiry.title"]}
          </Heading>
          <p className={styles.body}>
            {formatText(text["expiry.body"], { time: formatDuration((expiresAt ?? now) - now) })}
          </p>
          {stayFailure === null ? null : <Notice tone="problem">{failureText(stayFailure, text)}</Notice>}
          <div className={styles.actions}>
            <Button isDisabled={staying} onPress={() => void stay()}>
              {text["expiry.stay"]}
            </Button>
            <Button variant="secondary" isDisabled={pending} onPress={() => void signOut()}>
              {text["expiry.signOut"]}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export { SessionWatch }
