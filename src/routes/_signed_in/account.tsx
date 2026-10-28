import { createFileRoute } from "@tanstack/react-router"
import { AccountPage } from "../../features/session/AccountPage"

const Route = createFileRoute("/_signed_in/account")({
  component: AccountPage
})

export { Route }
