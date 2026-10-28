import { createFileRoute } from "@tanstack/react-router"
import { OverviewPage } from "../../features/overview/OverviewPage"

const Route = createFileRoute("/_signed_in/")({
  component: OverviewPage
})

export { Route }
