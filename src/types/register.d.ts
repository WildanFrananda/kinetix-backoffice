import type { BffError } from "../api/bff_error"
import type { getRouter } from "../router"

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: BffError
  }
}
