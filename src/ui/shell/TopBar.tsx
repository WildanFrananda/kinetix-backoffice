import { List, MagnifyingGlass } from "@phosphor-icons/react"
import { Button } from "react-aria-components"
import { useText } from "../../i18n/use_text"
import { LocaleToggle } from "./LocaleToggle"
import { ThemeToggle } from "./ThemeToggle"
import styles from "./TopBar.module.css"
import { shortcutLabel } from "./use_shortcut"

function TopBar({ onOpenNavigation, onOpenPalette }: { onOpenNavigation: () => void; onOpenPalette: () => void }) {
  const text = useText()

  return (
    <header className={styles.bar}>
      <Button className={styles.menu} aria-label={text["nav.open"]} onPress={onOpenNavigation}>
        <List aria-hidden="true" size={20} />
      </Button>
      <Button className={styles.search} onPress={onOpenPalette} aria-keyshortcuts="Meta+K Control+K">
        <MagnifyingGlass aria-hidden="true" className={styles.searchIcon} />
        <span className={styles.searchLabel}>{text["palette.trigger"]}</span>
        <kbd className={styles.kbd}>{shortcutLabel()}</kbd>
      </Button>
      <div className={styles.tools}>
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}

export { TopBar }
