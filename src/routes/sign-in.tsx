import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router"
import { sessionQuery } from "../api/session_query"
import { announceSession } from "../features/session/session_channel"
import { SignInFlow } from "../features/sign_in/SignInFlow"
import { safeRedirect } from "../features/sign_in/safe_redirect"
import { signInSearch } from "../features/sign_in/sign_in_search"
import type { SignedInSession } from "../types/signed_in_session.type"

function SignInPage() {
  const search = Route.useSearch()
  const { queryClient } = Route.useRouteContext()
  const navigate = useNavigate()

  function signedIn(session: SignedInSession): void {
    queryClient.setQueryData(sessionQuery().queryKey, session)
    announceSession({ type: "signed-in" })
    void navigate({ href: safeRedirect(search.redirect), replace: true })
  }

  return <SignInFlow notice={search.notice ?? null} onSignedIn={signedIn} />
}

const Route = createFileRoute("/sign-in")({
  validateSearch: signInSearch,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.fetchQuery({ ...sessionQuery(), staleTime: 0 })
    if (session.authenticated) {
      throw redirect({ href: safeRedirect(search.redirect), replace: true })
    }
  },
  component: SignInPage
})

export { Route }
