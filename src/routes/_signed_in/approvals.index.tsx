import { createFileRoute, redirect } from "@tanstack/react-router"

const Route = createFileRoute("/_signed_in/approvals/")({
  beforeLoad: () => {
    throw redirect({ to: "/approvals/sellers", replace: true })
  }
})

export { Route }
