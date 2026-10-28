import { QueryClientProvider } from "@tanstack/react-query"
import {
  ClientOnly,
  createRootRouteWithContext,
  HeadContent,
  lazyRouteComponent,
  Outlet,
  Scripts
} from "@tanstack/react-router"
import { type ReactNode, useEffect } from "react"
import { useLocale } from "../i18n/use_locale"
import appCss from "../styles/app.css?url"
import type { RouterContext } from "../types/router_context.type"
import { IconDefaults } from "../ui/IconDefaults"
import { MotionProvider } from "../ui/motion/MotionProvider"

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

function RootLayout() {
  const { queryClient } = Route.useRouteContext()
  const locale = useLocale()
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <QueryClientProvider client={queryClient}>
      <MotionProvider>
        <IconDefaults>
          <ClientOnly fallback={null}>
            <Outlet />
          </ClientOnly>
        </IconDefaults>
      </MotionProvider>
    </QueryClientProvider>
  )
}

const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "robots", content: "noindex, nofollow" },
      { title: "Kinetix Backoffice" }
    ],
    links: [
      { rel: "stylesheet", href: appCss, id: "react-aria-pressable-style" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }
    ],
    scripts: [{ src: "/theme.js" }]
  }),
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: lazyRouteComponent(() => import("../ui/RootFallbacks"), "RootNotFound"),
  errorComponent: lazyRouteComponent(() => import("../ui/RootFallbacks"), "RootError")
})

export { Route }
