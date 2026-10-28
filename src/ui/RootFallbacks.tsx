import type { ErrorComponentProps } from "@tanstack/react-router"
import { ErrorPage } from "./ErrorPage"
import { NotFoundPage } from "./NotFoundPage"
import { PublicFrame } from "./PublicFrame"

function RootNotFound() {
  return (
    <PublicFrame>
      <NotFoundPage />
    </PublicFrame>
  )
}

function RootError(props: ErrorComponentProps) {
  return (
    <PublicFrame>
      <ErrorPage {...props} />
    </PublicFrame>
  )
}

export { RootError, RootNotFound }
