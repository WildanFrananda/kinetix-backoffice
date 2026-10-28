import { lazy, type ReactNode, Suspense, useCallback, useEffect, useState } from "react"
import { followNetwork } from "../../api/connectivity"
import { followPresence } from "../../api/presence"
import { useText } from "../../i18n/use_text"
import styles from "./AppShell.module.css"
import { ConnectivityBanner } from "./ConnectivityBanner"
import { PageTransition } from "./PageTransition"
import { RouteAnnouncer } from "./RouteAnnouncer"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { useCommandK } from "./use_shortcut"

function loadPalette() {
  return import("./CommandPalette").then((module) => ({ default: module.CommandPalette }))
}

function loadNavigation() {
  return import("./MobileNavigation").then((module) => ({ default: module.MobileNavigation }))
}

const CommandPalette = lazy(loadPalette)

const MobileNavigation = lazy(loadNavigation)

function AppShell({ children }: { children: ReactNode }) {
  const text = useText()
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteUsed, setPaletteUsed] = useState(false)
  const [navigationUsed, setNavigationUsed] = useState(false)

  const openPalette = useCallback(() => {
    setPaletteUsed(true)
    setPaletteOpen(true)
  }, [])

  const togglePalette = useCallback(() => {
    setPaletteUsed(true)
    setPaletteOpen((open) => !open)
  }, [])

  function openNavigation(): void {
    setNavigationUsed(true)
    setNavigationOpen(true)
  }

  useCommandK(togglePalette)
  useEffect(() => followPresence(), [])
  useEffect(() => followNetwork(), [])

  useEffect(() => {
    const idle = window.setTimeout(() => void loadPalette(), 4_000)

    return () => window.clearTimeout(idle)
  }, [])

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skip}>
        {text["shell.skip"]}
      </a>
      <aside className={styles.aside}>
        <Sidebar />
      </aside>
      <div className={styles.column}>
        <TopBar onOpenNavigation={openNavigation} onOpenPalette={openPalette} />
        <ConnectivityBanner />
        <main id="main" className={styles.main} tabIndex={-1}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <Suspense fallback={null}>
        {navigationUsed ? <MobileNavigation isOpen={navigationOpen} onOpenChange={setNavigationOpen} /> : null}
        {paletteUsed ? <CommandPalette isOpen={paletteOpen} onOpenChange={setPaletteOpen} /> : null}
      </Suspense>
      <RouteAnnouncer />
    </div>
  )
}

export { AppShell }
