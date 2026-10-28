import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { sessionQuery } from "../api/session_query"
import { SessionWatch } from "../features/session/SessionWatch"

function SignedInLayout() {
  return (
    <>
      <SessionWatch />
      <Outlet />
    </>
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
