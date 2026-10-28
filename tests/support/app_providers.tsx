import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { IconDefaults } from "../../src/ui/IconDefaults"
import { MotionProvider } from "../../src/ui/motion/MotionProvider"

function testQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function AppProviders({ client, children }: { client: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <MotionProvider>
        <IconDefaults>{children}</IconDefaults>
      </MotionProvider>
    </QueryClientProvider>
  )
}

export { AppProviders, testQueryClient }
