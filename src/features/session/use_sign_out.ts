import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { bffRequest } from "../../api/bff_request"
import { logoutCall } from "../../api/calls/logout_call"
import type { BffFailure } from "../../types/bff_failure.type"
import { leaveSession } from "./leave_session"
import { announceSession } from "./session_channel"

function useSignOut() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<BffFailure | null>(null)

  async function signOut(): Promise<void> {
    setPending(true)
    setFailure(null)
    const result = await bffRequest(logoutCall)
    setPending(false)

    if (!result.ok) {
      setFailure(result.failure)
      return
    }

    announceSession({ type: "signed-out" })
    await leaveSession(queryClient, () => navigate({ to: "/sign-in", search: { notice: "signed-out" } }))
  }

  return { signOut, pending, failure }
}

export { useSignOut }
