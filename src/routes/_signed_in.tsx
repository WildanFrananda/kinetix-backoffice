import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { sessionQuery } from "../api/session_query"
import { SessionWatch } from "../features/session/SessionWatch"
import { AppShell } from "../ui/shell/AppShell"

function SignedInLayout() {
  return (
    <AppShell>
      <SessionWatch />
      <Outlet />
    </AppShell>
  )
}

const Route = createFileRoute("/_signed_in")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.fetchQuery({ ...sessionQuery(), staleTime: 30_000 })
    if (!session.authenticated) {
      throw redirect({ to: "/sign-in", search: { redirect: location.href } })
    }

    return { session }
  },
  component: SignedInLayout
})

export { Route }
