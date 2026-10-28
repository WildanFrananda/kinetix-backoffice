import { createFileRoute } from "@tanstack/react-router"
import { AccountPanel } from "../../features/session/AccountPanel"

const Route = createFileRoute("/_signed_in/")({
  component: AccountPanel
})

export { Route }
